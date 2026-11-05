import { yawToward, type Point } from '../scene/layout';
import { shortestAngle } from '../util/math';
import type { Incoming, Pose, PresenceMap, VisitorMeta } from './protocol';

export interface Visitor {
  id: string;
  meta: VisitorMeta | null;
  /** phx_ref của các lần track còn sống (một khách có thể còn bóng cũ của lần kết nối trước). */
  refs: Set<string>;
  /** Vị trí đang vẽ. */
  shown: Pose | null;
  /** Các điểm còn phải đi tới (qua cửa nếu cần), điểm cuối là chỗ họ vừa dừng. */
  path: Point[];
  /** Tốc độ đi của chặng này (m/s). */
  speed: number;
  /** Hướng nhìn khi tới nơi. */
  face: number;
  /** Thời điểm nhận vị trí gần nhất (ms), để dọn khách chỉ có vị trí mà không có Presence. */
  seenAt: number;
}

const MAX_VISITORS = 200;
const ORPHAN_MS = 30_000;

/** Danh sách khách khác đang tham quan, dựng từ presence_state / presence_diff / broadcast pos. */
export class Roster {
  readonly visitors = new Map<string, Visitor>();

  constructor(readonly selfId: string) {}

  /** Số người đang tham quan, kể cả mình. */
  get count(): number {
    let n = 1;
    for (const v of this.visitors.values()) if (v.refs.size) n++;
    return n;
  }

  /** Khách vẽ được: có Presence và đã biết vị trí. */
  *present(): Iterable<Visitor> {
    for (const v of this.visitors.values()) if (v.refs.size && v.meta && v.shown) yield v;
  }

  clear(): void {
    this.visitors.clear();
  }

  /** Trả về id các khách mới xuất hiện (để gửi lại vị trí của mình cho họ). */
  apply(msg: Incoming, now: number): string[] {
    switch (msg.kind) {
      case 'state':
        return this.join(msg.joins);
      case 'diff': {
        const added = this.join(msg.joins);
        this.leave(msg.leaves);
        return added.filter((id) => this.visitors.has(id));
      }
      case 'pos':
        this.move(msg.id, msg.pose, now);
        return [];
      default:
        return [];
    }
  }

  private entry(id: string): Visitor | null {
    let v = this.visitors.get(id);
    if (!v) {
      if (this.visitors.size >= MAX_VISITORS) return null;
      v = { id, meta: null, refs: new Set(), shown: null, path: [], speed: WALK_SPEED, face: 0, seenAt: 0 };
      this.visitors.set(id, v);
    }
    return v;
  }

  private join(map: PresenceMap): string[] {
    const added: string[] = [];
    for (const [id, metas] of map) {
      if (id === this.selfId) continue;
      const v = this.entry(id);
      if (!v) continue;
      const wasPresent = v.refs.size > 0;
      for (const [ref, meta] of metas) {
        v.refs.add(ref);
        v.meta = meta;
      }
      if (!wasPresent) added.push(id);
    }
    return added;
  }

  private leave(map: PresenceMap): void {
    for (const [id, metas] of map) {
      const v = this.visitors.get(id);
      if (!v) continue;
      for (const ref of metas.keys()) v.refs.delete(ref);
      if (!v.refs.size) this.visitors.delete(id);
    }
  }

  private move(id: string, pose: Pose, now: number): void {
    if (id === this.selfId) return;
    this.pruneOrphans(now);
    const v = this.entry(id);
    if (!v) return;
    v.seenAt = now;
    v.face = pose.yaw;
    if (!v.shown) {
      v.shown = { ...pose };
      return;
    }
    v.path = planPath(v.shown, pose);
    v.speed = Math.max(WALK_SPEED, pathLength(v.shown, v.path) / MAX_TRIP_SECONDS);
  }

  /** Vị trí từ id chưa có Presence: giữ một lúc (Presence có thể tới chậm), quá lâu thì bỏ. */
  private pruneOrphans(now: number): void {
    for (const [id, v] of this.visitors) if (!v.refs.size && now - v.seenAt > ORPHAN_MS) this.visitors.delete(id);
  }

  /** Cho hình người đi dần tới chỗ khách vừa dừng. */
  update(dt: number): void {
    for (const v of this.visitors.values()) if (v.shown) v.shown = walkStep(v.shown, v.path, v.speed, v.face, dt);
  }
}

export const WALK_SPEED = 3;
/** Đi xa (bấm thanh gian nhảy qua mấy gian) thì đi nhanh hơn, mỗi chặng tối đa chừng này giây. */
export const MAX_TRIP_SECONDS = 2.5;
const DOOR_OUTSIDE_X = -1.6;
const DOOR_INSIDE_X = 1.2;
const TURN_RATE = 10;

/** Đường đi từ chỗ đang vẽ tới chỗ mới; ra/vào nhà thì đi qua khung cửa, không xuyên vách. */
export function planPath(from: Point, to: Point): Point[] {
  const path: Point[] = [];
  const fromIn = from.x >= 0;
  if (fromIn !== to.x >= 0) {
    path.push({ x: fromIn ? DOOR_INSIDE_X : DOOR_OUTSIDE_X, z: 0 }, { x: fromIn ? DOOR_OUTSIDE_X : DOOR_INSIDE_X, z: 0 });
  }
  path.push({ x: to.x, z: to.z });
  return path;
}

export function pathLength(from: Point, path: Point[]): number {
  let total = 0;
  let at = from;
  for (const p of path) {
    total += Math.hypot(p.x - at.x, p.z - at.z);
    at = p;
  }
  return total;
}

/** Đi một bước theo `path` (bỏ dần các điểm đã tới), quay mặt theo hướng đi; tới nơi thì quay về `face`. */
export function walkStep(from: Pose, path: Point[], speed: number, face: number, dt: number): Pose {
  let { x, z } = from;
  let budget = speed * dt;
  while (path.length && budget > 0) {
    const p = path[0];
    const d = Math.hypot(p.x - x, p.z - z);
    if (d <= budget) {
      x = p.x;
      z = p.z;
      budget -= d;
      path.shift();
    } else {
      x += ((p.x - x) / d) * budget;
      z += ((p.z - z) / d) * budget;
      budget = 0;
    }
  }
  const goal = path.length ? yawToward({ x, z }, path[0]) : face;
  const yaw = from.yaw + shortestAngle(from.yaw, goal) * (1 - Math.exp(-TURN_RATE * dt));
  return { x, z, yaw };
}

/** Khoảng tối thiểu giữa hai lần gửi, và quãng tối thiểu coi là "đã tới chỗ mới". */
export const SEND_GAP_MS = 1000;
export const MIN_MOVE = 0.5;

/**
 * Gửi vị trí của mình chỉ khi đã dừng ở chỗ mới (chỗ đứng, trước hiện vật, hay buông phím W A S D),
 * không gửi trong lúc đang đi hay chỉ nhìn quanh. Có khách mới vào thì gửi lại ngay để họ thấy mình.
 */
export class PoseSender {
  private last: Pose | null = null;
  private lastAt = -Infinity;
  private force = false;

  resend(): void {
    this.force = true;
  }

  /** Gọi mỗi khung hình (rẻ); trả về vị trí cần gửi, hoặc null. */
  tick(pose: Pose, moving: boolean, now: number): Pose | null {
    if (!this.force) {
      if (moving || now - this.lastAt < SEND_GAP_MS) return null;
      if (this.last && Math.hypot(pose.x - this.last.x, pose.z - this.last.z) < MIN_MOVE) return null;
    }
    this.force = false;
    this.last = { ...pose };
    this.lastAt = now;
    return this.last;
  }
}
