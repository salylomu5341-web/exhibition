import { heartbeatMessage, joinMessage, parseIncoming, posMessage, realtimeUrl, trackMessage, type Pose, type VisitorMeta, type Wire } from './protocol';
import { PoseSender, Roster } from './roster';

export interface PresenceOptions {
  url: string;
  apiKey: string;
  id: string;
  meta: VisitorMeta;
  /** Danh sách khách đổi (vào / ra / kết nối lại). */
  onChange?: () => void;
  /** Đổi cho kiểm thử. */
  WebSocketImpl?: typeof WebSocket;
}

const HEARTBEAT_MS = 25_000;
const RETRY_MS = [2_000, 5_000, 15_000, 30_000, 60_000];
const MAX_RETRIES = 8;

/**
 * Kết nối Supabase Realtime cho khách ảo. Không bao giờ ném lỗi ra ngoài: mạng chặn, Supabase lỗi
 * hay vượt hạn mức thì chỉ đơn giản là không thấy khách khác, nhà dài vẫn chạy như cũ.
 */
export class PresenceClient {
  readonly roster: Roster;
  /** Đã vào kênh (biết được số người). */
  joined = false;
  private ws: WebSocket | null = null;
  private ref = 0;
  private joinRef = '';
  private heartbeat: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private retries = 0;
  private stopped = false;
  private readonly sender = new PoseSender();
  private pose: Pose | null = null;
  private moving = false;

  constructor(private readonly o: PresenceOptions) {
    this.roster = new Roster(o.id);
  }

  start(): void {
    this.stopped = false;
    if (this.ws || this.retryTimer) return;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.teardown();
  }

  /** Gọi mỗi khung hình với vị trí camera của mình; chỉ thật sự gửi khi đã dừng ở chỗ mới. */
  tick(pose: Pose, moving: boolean, now: number): void {
    this.pose = pose;
    this.moving = moving;
    if (!this.joined) return;
    const send = this.sender.tick(pose, moving, now);
    if (send) this.send(posMessage(this.o.id, send, this.nextRef(), this.joinRef));
  }

  private nextRef(): string {
    return String(++this.ref);
  }

  private send(msg: Wire): void {
    try {
      if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(msg));
    } catch {
      // Bỏ qua: lần sau sẽ gửi lại.
    }
  }

  private connect(): void {
    try {
      const Impl = this.o.WebSocketImpl ?? globalThis.WebSocket;
      if (!Impl) return;
      const ws = new Impl(realtimeUrl(this.o.url, this.o.apiKey));
      this.ws = ws;
      ws.onopen = () => {
        this.joinRef = this.nextRef();
        this.send(joinMessage(this.o.id, this.joinRef));
        this.heartbeat = setInterval(() => this.send(heartbeatMessage(this.nextRef())), HEARTBEAT_MS);
      };
      ws.onmessage = (e) => this.receive(typeof e.data === 'string' ? e.data : '');
      ws.onclose = () => this.lost();
      ws.onerror = () => this.lost();
    } catch {
      this.lost();
    }
  }

  private receive(raw: string): void {
    const msg = parseIncoming(raw);
    if (!msg) return;
    switch (msg.kind) {
      case 'joined':
        if (msg.ref !== this.joinRef) return;
        this.joined = true;
        this.retries = 0;
        this.roster.clear();
        this.send(trackMessage(this.o.meta, this.nextRef(), this.joinRef));
        this.resendPose();
        this.o.onChange?.();
        return;
      case 'join-error':
      case 'closed':
        this.lost();
        return;
      default: {
        const before = this.roster.count;
        const added = this.roster.apply(msg, Date.now());
        if (added.length) this.resendPose();
        if (added.length || this.roster.count !== before) this.o.onChange?.();
      }
    }
  }

  /** Gửi lại vị trí ngay, không đợi khung hình (thẻ đang ẩn thì không có khung hình nào). */
  private resendPose(): void {
    this.sender.resend();
    if (this.pose) this.tick(this.pose, this.moving, performance.now());
  }

  private teardown(): void {
    if (this.heartbeat) clearInterval(this.heartbeat);
    this.heartbeat = null;
    const ws = this.ws;
    this.ws = null;
    if (ws) {
      ws.onopen = ws.onmessage = ws.onclose = ws.onerror = null;
      try {
        ws.close();
      } catch {
        // Đã đóng.
      }
    }
    const wasJoined = this.joined;
    this.joined = false;
    this.roster.clear();
    if (wasJoined) this.o.onChange?.();
  }

  private lost(): void {
    this.teardown();
    if (this.stopped || this.retryTimer || this.retries >= MAX_RETRIES) return;
    const wait = RETRY_MS[Math.min(this.retries, RETRY_MS.length - 1)];
    this.retries++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.stopped) this.connect();
    }, wait);
  }
}

export function randomId(): string {
  try {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  } catch {
    return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
  }
}
