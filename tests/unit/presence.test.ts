import { afterEach, describe, expect, it, vi } from 'vitest';
import { PresenceClient } from '../../src/presence/client';
import { joinMessage, parseIncoming, posMessage, realtimeUrl, TOPIC, type Incoming } from '../../src/presence/protocol';
import { MAX_TRIP_SECONDS, planPath, PoseSender, Roster, SEND_GAP_MS, walkStep, WALK_SPEED } from '../../src/presence/roster';
import { spreadOffset } from '../../src/scene/avatars';

const frame = (event: string, payload: unknown, extra: Record<string, unknown> = {}) => JSON.stringify({ topic: TOPIC, event, payload, ref: null, ...extra });
const metas = (ref: string, n = 12, c = 1) => ({ metas: [{ phx_ref: ref, n, c }] });
const parse = (raw: string) => parseIncoming(raw) as Incoming;

describe('giao thức Realtime', () => {
  it('địa chỉ websocket và kênh có tiền tố mnong-', () => {
    expect(realtimeUrl('https://abc.supabase.co/', 'sb_publishable_x')).toBe('wss://abc.supabase.co/realtime/v1/websocket?apikey=sb_publishable_x&vsn=1.0.0');
    const join = joinMessage('khach1', '1');
    expect(join.topic).toBe('realtime:mnong-visitors');
    expect(join.payload).toMatchObject({ config: { presence: { key: 'khach1', enabled: true }, broadcast: { self: false } } });
  });

  it('đọc presence_state / presence_diff, bỏ meta sai dạng', () => {
    const state = parse(frame('presence_state', { a: metas('r1'), b: { metas: [{ phx_ref: 'r2', n: 'x', c: 1 }] }, 'bad key!': metas('r3') }));
    expect(state.kind).toBe('state');
    if (state.kind !== 'state') return;
    expect([...state.joins.keys()]).toEqual(['a']);
    expect(state.joins.get('a')!.get('r1')).toEqual({ n: 12, c: 1 });

    const diff = parse(frame('presence_diff', { joins: { c: metas('r4', 99, 5) }, leaves: { a: metas('r1') } }));
    expect(diff.kind).toBe('diff');
    expect(parse(frame('presence_diff', { joins: { c: metas('r4', 100, 0) }, leaves: {} }))).toMatchObject({ kind: 'diff', joins: new Map() });
    expect(parse(frame('presence_diff', { joins: { c: metas('r4', 1, 6) }, leaves: {} }))).toMatchObject({ kind: 'diff', joins: new Map() });
  });

  it('đọc vị trí broadcast, bỏ số lạ và kênh khác', () => {
    const sent = posMessage('a', { x: 3.14159, z: -1, yaw: 0.5 }, '5', '1');
    expect(sent.payload).toEqual({ type: 'broadcast', event: 'pos', payload: { i: 'a', x: 3.14, z: -1, y: 0.5 } });
    const echo = (p: unknown) => parseIncoming(frame('broadcast', { type: 'broadcast', event: 'pos', payload: p }));
    expect(echo({ i: 'a', x: 3, z: 0, y: 1 })).toEqual({ kind: 'pos', id: 'a', pose: { x: 3, z: 0, yaw: 1 } });
    expect(echo({ i: 'a', x: 1e9, z: 0, y: 1 })).toBeNull();
    expect(echo({ i: 'a', x: '3', z: 0, y: 1 })).toBeNull();
    expect(echo({ i: '<img>', x: 3, z: 0, y: 1 })).toBeNull();
    expect(parseIncoming(JSON.stringify({ topic: 'realtime:khac', event: 'broadcast', payload: {} }))).toBeNull();
    expect(parseIncoming('không phải JSON')).toBeNull();
  });

  it('phx_reply: chỉ câu trả lời cho lệnh join', () => {
    expect(parseIncoming(frame('phx_reply', { status: 'ok' }, { ref: '1', join_ref: '1' }))).toEqual({ kind: 'joined', ref: '1' });
    expect(parseIncoming(frame('phx_reply', { status: 'error' }, { ref: '1', join_ref: '1' }))).toEqual({ kind: 'join-error', ref: '1' });
    expect(parseIncoming(frame('phx_reply', { status: 'ok' }, { ref: '2', join_ref: '1' }))).toBeNull();
    // Supabase thật trả lời không kèm join_ref.
    expect(parseIncoming(frame('phx_reply', { status: 'ok', response: { postgres_changes: [] } }, { ref: '1' }))).toEqual({ kind: 'joined', ref: '1' });
  });
});

describe('Roster', () => {
  it('đếm cả mình, bỏ qua chính mình trong presence, ra thì xoá', () => {
    const r = new Roster('me');
    expect(r.count).toBe(1);
    const added = r.apply(parse(frame('presence_state', { me: metas('r0'), a: metas('r1'), b: metas('r2') })), 0);
    expect(added.sort()).toEqual(['a', 'b']);
    expect(r.count).toBe(3);
    r.apply(parse(frame('presence_diff', { joins: {}, leaves: { a: metas('r1') } })), 0);
    expect(r.count).toBe(2);
    expect(r.visitors.has('a')).toBe(false);
  });

  it('kết nối lại (join mới + leave cũ cùng lúc) vẫn giữ khách', () => {
    const r = new Roster('me');
    r.apply(parse(frame('presence_state', { a: metas('old') })), 0);
    const added = r.apply(parse(frame('presence_diff', { joins: { a: metas('new') }, leaves: { a: metas('old') } })), 0);
    expect(added).toEqual([]);
    expect(r.count).toBe(2);
  });

  it('chỉ vẽ khách có presence và đã có vị trí; vị trí mồ côi bị dọn', () => {
    const r = new Roster('me');
    const pos = (id: string, x: number) => parse(frame('broadcast', { type: 'broadcast', event: 'pos', payload: { i: id, x, z: 0, y: 0 } }));
    r.apply(parse(frame('presence_state', { a: metas('r1') })), 0);
    expect([...r.present()]).toHaveLength(0);
    r.apply(pos('a', 3), 0);
    r.apply(pos('ghost', 3), 0);
    r.apply(pos('me', 3), 0);
    expect([...r.present()].map((v) => v.id)).toEqual(['a']);
    expect(r.count).toBe(2);
    r.apply(pos('a', 4), 60_000);
    expect(r.visitors.has('ghost')).toBe(false);
  });

  it('đi dần tới chỗ mới rồi quay mặt theo hướng họ nhìn', () => {
    const r = new Roster('me');
    r.apply(parse(frame('presence_state', { a: metas('r1') })), 0);
    const pos = (x: number, y = 0) => parse(frame('broadcast', { type: 'broadcast', event: 'pos', payload: { i: 'a', x, z: 0, y } }));
    r.apply(pos(3), 0);
    const v = r.visitors.get('a')!;
    expect(v.shown).toEqual({ x: 3, z: 0, yaw: 0 }); // lần đầu: hiện ngay tại chỗ
    r.apply(pos(7, 1), 0);
    r.update(0.5);
    expect(v.shown!.x).toBeCloseTo(3 + WALK_SPEED * 0.5);
    expect(v.path).toHaveLength(1);
    for (let k = 0; k < 40; k++) r.update(0.05);
    expect(v.shown!.x).toBe(7);
    expect(v.path).toHaveLength(0);
    expect(v.shown!.yaw).toBeCloseTo(1, 2);
  });

  it('đi xa thì nhanh hơn, không quá MAX_TRIP_SECONDS', () => {
    const r = new Roster('me');
    r.apply(parse(frame('presence_state', { a: metas('r1') })), 0);
    const pos = (x: number) => parse(frame('broadcast', { type: 'broadcast', event: 'pos', payload: { i: 'a', x, z: 0, y: 0 } }));
    r.apply(pos(3), 0);
    r.apply(pos(60), 0);
    for (let t = 0; t < MAX_TRIP_SECONDS + 0.05; t += 0.05) r.update(0.05);
    expect(r.visitors.get('a')!.shown!.x).toBe(60);
  });
});

describe('planPath / walkStep', () => {
  it('ra vào nhà thì đi qua khung cửa', () => {
    expect(planPath({ x: -9, z: 0 }, { x: 3, z: 0 })).toEqual([{ x: -1.6, z: 0 }, { x: 1.2, z: 0 }, { x: 3, z: 0 }]);
    expect(planPath({ x: 3, z: 1.2 }, { x: -9, z: 0 })).toEqual([{ x: 1.2, z: 0 }, { x: -1.6, z: 0 }, { x: -9, z: 0 }]);
    expect(planPath({ x: 3, z: 0 }, { x: 12, z: -1.2 })).toEqual([{ x: 12, z: -1.2 }]);
  });

  it('một bước đi qua được nhiều điểm, mặt quay theo hướng đi', () => {
    const path = planPath({ x: -2, z: 0 }, { x: 3, z: 0 });
    const p = walkStep({ x: -2, z: 0, yaw: 0 }, path, 3, 0, 1);
    expect(p.x).toBeCloseTo(1);
    expect(path).toEqual([{ x: 1.2, z: 0 }, { x: 3, z: 0 }]);
    // Đi về +x: yaw hướng về -π/2.
    const q = walkStep(p, path, 0.01, 0, 2);
    expect(q.yaw).toBeLessThan(-1);
  });
});

describe('PoseSender', () => {
  const at = (x: number, yaw = 0) => ({ x, z: 0, yaw });

  it('chỉ gửi khi đã dừng ở chỗ mới, không gửi lúc đang đi hay chỉ nhìn quanh', () => {
    const s = new PoseSender();
    expect(s.tick(at(0), false, 0)).toEqual(at(0));
    // Đang đi: không gửi, dù bao nhiêu khung hình.
    for (let t = SEND_GAP_MS; t < 5000; t += 16) expect(s.tick(at(t / 1000), true, t)).toBeNull();
    // Dừng ở chỗ mới: gửi một lần.
    expect(s.tick(at(5), false, 5000)).toEqual(at(5));
    expect(s.tick(at(5), false, 7000)).toBeNull();
    // Chỉ quay đầu nhìn quanh: không gửi.
    expect(s.tick(at(5, 2), false, 9000)).toBeNull();
    // Nhích chưa tới nửa mét: không gửi.
    expect(s.tick(at(5.3), false, 11000)).toBeNull();
  });

  it('cách nhau tối thiểu SEND_GAP_MS; có khách mới thì gửi lại ngay', () => {
    const s = new PoseSender();
    s.tick(at(0), false, 0);
    expect(s.tick(at(3), false, 300)).toBeNull();
    expect(s.tick(at(3), false, SEND_GAP_MS)).toEqual(at(3));
    s.resend();
    expect(s.tick(at(3), true, SEND_GAP_MS + 10)).toEqual(at(3));
  });
});

describe('spreadOffset', () => {
  it('ổn định theo id, lệch 0,8–1,4 m (hai người cùng chỗ đứng vẫn thấy nhau)', () => {
    expect(spreadOffset('abc')).toEqual(spreadOffset('abc'));
    for (const id of ['a', 'b', 'khach-1', '0123456789abcdef']) {
      const { dx, dz } = spreadOffset(id);
      const r = Math.hypot(dx, dz);
      expect(r).toBeGreaterThanOrEqual(0.8);
      expect(r).toBeLessThanOrEqual(1.4);
    }
  });
});

class FakeSocket {
  static last: FakeSocket | null = null;
  static count = 0;
  readyState = 0;
  sent: Array<{ event: string; payload: { event?: string } }> = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(readonly url: string) {
    FakeSocket.last = this;
    FakeSocket.count++;
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = 3;
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
  push(raw: string) {
    this.onmessage?.({ data: raw });
  }
}

describe('PresenceClient', () => {
  afterEach(() => {
    vi.useRealTimers();
    FakeSocket.last = null;
    FakeSocket.count = 0;
  });

  const make = (onChange = vi.fn()) =>
    new PresenceClient({ url: 'https://abc.supabase.co', apiKey: 'k', id: 'me', meta: { n: 7, c: 2 }, onChange, WebSocketImpl: FakeSocket as unknown as typeof WebSocket });

  it('vào kênh, track, gửi vị trí, đếm người', () => {
    const onChange = vi.fn();
    const c = make(onChange);
    c.start();
    const ws = FakeSocket.last!;
    ws.open();
    expect(ws.sent[0].event).toBe('phx_join');
    const joinRef = (ws.sent[0] as unknown as { ref: string }).ref;
    c.tick({ x: 1, z: 0, yaw: 0 }, false, 0);
    expect(ws.sent).toHaveLength(1); // chưa vào kênh thì không gửi gì
    ws.push(frame('phx_reply', { status: 'ok' }, { ref: joinRef, join_ref: joinRef }));
    expect(c.joined).toBe(true);
    expect(ws.sent[1]).toMatchObject({ event: 'presence', payload: { event: 'track', payload: { n: 7, c: 2 } } });
    // Vào kênh: gửi chỗ đang đứng ngay.
    expect(ws.sent[2]).toMatchObject({ event: 'broadcast', payload: { event: 'pos', payload: { x: 1 } } });
    c.tick({ x: 1, z: 0, yaw: 0 }, false, 5000);
    for (let t = 5000; t < 8000; t += 16) c.tick({ x: 1 + (t - 5000) / 1000, z: 0, yaw: 0 }, true, t);
    expect(ws.sent).toHaveLength(3); // đứng yên hay đang đi: không gửi
    c.tick({ x: 4, z: 0, yaw: 0 }, false, 8000);
    expect(ws.sent).toHaveLength(4);
    expect(ws.sent[3]).toMatchObject({ payload: { payload: { x: 4 } } });
    ws.sent.length = 3;
    ws.push(frame('presence_diff', { joins: { a: metas('r1') }, leaves: {} }));
    expect(c.roster.count).toBe(2);
    expect(onChange).toHaveBeenCalled();
    // Có khách mới: gửi lại vị trí ngay, dù đứng yên và không có khung hình.
    expect(ws.sent).toHaveLength(4);
    expect(ws.sent[3]).toMatchObject({ event: 'broadcast', payload: { event: 'pos' } });
  });

  it('mất kết nối thì thử lại, có giới hạn; dừng thì thôi', () => {
    vi.useFakeTimers();
    const c = make();
    c.start();
    for (let i = 0; i < 20; i++) {
      FakeSocket.last!.onclose?.();
      vi.advanceTimersByTime(60_000);
    }
    expect(FakeSocket.count).toBe(9); // 1 lần đầu + 8 lần thử lại
    c.stop();
    expect(c.joined).toBe(false);
  });

  it('không có WebSocket thì im lặng', () => {
    const c = new PresenceClient({ url: 'https://abc.supabase.co', apiKey: 'k', id: 'me', meta: { n: 1, c: 0 }, WebSocketImpl: undefined });
    const saved = globalThis.WebSocket;
    // @ts-expect-error giả lập trình duyệt cũ
    delete globalThis.WebSocket;
    try {
      expect(() => c.start()).not.toThrow();
      expect(() => c.tick({ x: 0, z: 0, yaw: 0 }, false, 0)).not.toThrow();
    } finally {
      if (saved) globalThis.WebSocket = saved;
    }
  });
});
