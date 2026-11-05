// Giao thức Supabase Realtime (Phoenix, vsn 1.0.0, JSON) cho "khách ảo": chỉ dùng Presence và Broadcast,
// không đụng bảng nào. Mọi thứ nhận về đều do trình duyệt khác gửi, nên kiểm tra chặt trước khi dùng.
import { HALF_WIDTH, HOUSE_LENGTH } from '../scene/layout';

/** Tiền tố mnong- để không đụng kênh của các app khác dùng chung dự án Supabase. */
export const CHANNEL = 'mnong-visitors';
export const TOPIC = `realtime:${CHANNEL}`;
/** Số màu áo khách (xem AVATAR_COLORS trong scene/avatars.ts). */
export const COLOR_COUNT = 6;
export const MAX_NUMBER = 99;

export interface Wire {
  topic: string;
  event: string;
  payload: unknown;
  ref?: string | null;
  join_ref?: string | null;
}

/** Thông tin khách gửi qua Presence: số thứ tự để ghép tên "Khách 12" và màu áo. Tên ghép ở máy nhận, không lấy chữ từ mạng. */
export interface VisitorMeta {
  n: number;
  c: number;
}

export interface Pose {
  x: number;
  z: number;
  yaw: number;
}

export type Incoming =
  | { kind: 'joined'; ref: string }
  | { kind: 'join-error'; ref: string }
  | { kind: 'state'; joins: PresenceMap }
  | { kind: 'diff'; joins: PresenceMap; leaves: PresenceMap }
  | { kind: 'pos'; id: string; pose: Pose }
  | { kind: 'closed' };

/** key → (phx_ref → meta). */
export type PresenceMap = Map<string, Map<string, VisitorMeta>>;

export function realtimeUrl(supabaseUrl: string, key: string): string {
  const base = supabaseUrl.replace(/^http/, 'ws').replace(/\/+$/, '');
  return `${base}/realtime/v1/websocket?apikey=${encodeURIComponent(key)}&vsn=1.0.0`;
}

export function joinMessage(id: string, ref: string): Wire {
  return {
    topic: TOPIC,
    event: 'phx_join',
    payload: { config: { broadcast: { self: false, ack: false }, presence: { key: id, enabled: true }, private: false } },
    ref,
    join_ref: ref,
  };
}

export function trackMessage(meta: VisitorMeta, ref: string, joinRef: string): Wire {
  return { topic: TOPIC, event: 'presence', payload: { type: 'presence', event: 'track', payload: meta }, ref, join_ref: joinRef };
}

export function posMessage(id: string, pose: Pose, ref: string, joinRef: string): Wire {
  const r = (v: number) => Math.round(v * 100) / 100;
  return {
    topic: TOPIC,
    event: 'broadcast',
    payload: { type: 'broadcast', event: 'pos', payload: { i: id, x: r(pose.x), z: r(pose.z), y: r(pose.yaw) } },
    ref,
    join_ref: joinRef,
  };
}

export function heartbeatMessage(ref: string): Wire {
  return { topic: 'phoenix', event: 'heartbeat', payload: {}, ref };
}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isId = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v);
const isInt = (v: unknown, min: number, max: number): v is number => Number.isInteger(v) && (v as number) >= min && (v as number) <= max;
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function parseMeta(v: unknown): VisitorMeta | null {
  if (!isObj(v) || !isInt(v.n, 1, MAX_NUMBER) || !isInt(v.c, 0, COLOR_COUNT - 1)) return null;
  return { n: v.n, c: v.c };
}

/** Vùng có thể đứng: sân trước tới cuối nhà, thêm chút dư. Ngoài vùng này là dữ liệu lạ, bỏ. */
const X_MIN = -20;
const X_MAX = HOUSE_LENGTH + 2;
const Z_MAX = Math.max(HALF_WIDTH, 9) + 2;

export function parsePose(v: Record<string, unknown>): Pose | null {
  const { x, z, y } = v;
  if (!isNum(x) || !isNum(z) || !isNum(y)) return null;
  if (x < X_MIN || x > X_MAX || Math.abs(z) > Z_MAX || Math.abs(y) > 1e4) return null;
  return { x, z, yaw: y };
}

const MAX_KEYS = 200;

function parsePresenceMap(v: unknown): PresenceMap {
  const out: PresenceMap = new Map();
  if (!isObj(v)) return out;
  for (const [key, entry] of Object.entries(v)) {
    if (out.size >= MAX_KEYS) break;
    if (!isId(key) || !isObj(entry) || !Array.isArray(entry.metas)) continue;
    const metas = new Map<string, VisitorMeta>();
    for (const m of entry.metas.slice(0, 5)) {
      const meta = parseMeta(m);
      const ref = isObj(m) && typeof m.phx_ref === 'string' ? m.phx_ref : null;
      if (meta && ref) metas.set(ref, meta);
    }
    if (metas.size) out.set(key, metas);
  }
  return out;
}

/** Đọc một khung tin; trả null nếu không liên quan hoặc sai dạng. */
export function parseIncoming(raw: string): Incoming | null {
  let msg: unknown;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(msg) || msg.topic !== TOPIC || typeof msg.event !== 'string') return null;
  const payload = msg.payload;
  switch (msg.event) {
    case 'phx_reply': {
      // Supabase không gửi kèm join_ref trong câu trả lời; client so `ref` với lệnh vào kênh của mình.
      if (!isObj(payload) || typeof msg.ref !== 'string' || (msg.join_ref != null && msg.ref !== msg.join_ref)) return null;
      return payload.status === 'ok' ? { kind: 'joined', ref: msg.ref } : { kind: 'join-error', ref: msg.ref };
    }
    case 'phx_error':
    case 'phx_close':
      return { kind: 'closed' };
    case 'presence_state':
      return { kind: 'state', joins: parsePresenceMap(payload) };
    case 'presence_diff':
      if (!isObj(payload)) return null;
      return { kind: 'diff', joins: parsePresenceMap(payload.joins), leaves: parsePresenceMap(payload.leaves) };
    case 'broadcast': {
      if (!isObj(payload) || payload.event !== 'pos' || !isObj(payload.payload)) return null;
      const p = payload.payload;
      const pose = parsePose(p);
      return isId(p.i) && pose ? { kind: 'pos', id: p.i, pose } : null;
    }
    default:
      return null;
  }
}
