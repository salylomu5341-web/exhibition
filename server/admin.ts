/**
 * API đọc nội dung và lưu từ trang quản trị. Dùng chung cho hàm Vercel (`api/`) và máy chủ thử trên máy.
 * Tài khoản quản trị: biến môi trường ADMIN_USERNAME và ADMIN_PASSWORD (đặt trên Vercel, và trong .env.local khi chạy trên máy).
 * Đường dẫn import có đuôi .js: hàm Vercel chạy ES module của Node, cần đủ đuôi file.
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { RoomSchema, SiteSchema } from '../src/content/schema.js';
import { readRows, upsertRows, type Env, type Row } from './supabase.js';

const SITE_ROW = 'site';
const MAX_BODY = 2_000_000;

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });

const digest = (s: string) => createHash('sha256').update(s).digest();

const same = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

/** Đúng tên và mật khẩu trong biến môi trường; chưa đặt biến thì không ai đăng nhập được. */
export function checkLogin(env: Env, username: unknown, password: unknown): boolean {
  const u = env.ADMIN_USERNAME;
  const p = env.ADMIN_PASSWORD;
  if (!u || !p || typeof username !== 'string' || typeof password !== 'string') return false;
  // So cả hai rồi mới kết hợp, để thời gian trả lời không lộ phần nào đúng.
  const okUser = same(username, u);
  const okPass = same(password, p);
  return okUser && okPass;
}

const denied = async (env: Env) => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) return json(500, { error: 'Chưa đặt ADMIN_USERNAME và ADMIN_PASSWORD trên Vercel.' });
  await new Promise((r) => setTimeout(r, 500));
  return json(401, { error: 'Sai tên đăng nhập hoặc mật khẩu' });
};

/** POST /api/admin/login { username, password } */
export async function handleLogin(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  if (!body || !checkLogin(env, body.username, body.password)) return denied(env);
  return json(200, { ok: true });
}

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  const text = await req.text();
  if (text.length > MAX_BODY) return null;
  try {
    const value = JSON.parse(text) as unknown;
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** GET /api/content: mọi dòng nội dung. */
export async function handleContent(env: Env): Promise<Response> {
  try {
    // CDN giữ 10 giây: sửa xong vài giây sau là khách thấy, mà Supabase không bị gọi theo từng lượt xem.
    return json(200, await readRows(env), { 'Cache-Control': 'public, max-age=0, s-maxage=10, stale-while-revalidate=60' });
  } catch (err) {
    return json(502, { error: (err as Error).message });
  }
}

/** Kiểm tra từng dòng sắp ghi; trả danh sách lỗi (rỗng là hợp lệ). */
export function validateRows(rows: unknown): { rows: Row[]; errors: string[] } {
  if (!Array.isArray(rows) || rows.length === 0) return { rows: [], errors: ['không có nội dung nào để lưu'] };
  const errors: string[] = [];
  const out: Row[] = [];
  for (const r of rows as Array<{ id?: unknown; data?: unknown }>) {
    const id = typeof r?.id === 'string' ? r.id : '';
    if (!/^[a-z0-9-]+$/.test(id)) {
      errors.push(`id không hợp lệ: ${String(r?.id)}`);
      continue;
    }
    const parsed = id === SITE_ROW ? SiteSchema.safeParse(r.data) : RoomSchema.safeParse(r.data);
    if (!parsed.success) errors.push(...parsed.error.issues.map((i) => `${id} › ${i.path.join('.')}: ${i.message}`));
    else if (id !== SITE_ROW && (parsed.data as { id: string }).id !== id) errors.push(`${id}: id trong nội dung phải là "${id}"`);
    else out.push({ id, data: parsed.data });
  }
  return { rows: out, errors };
}

/** POST /api/admin/save { username, password, changes: [{ id, data }] } */
export async function handleSave(req: Request, env: Env): Promise<Response> {
  const body = await readBody(req);
  if (!body) return json(400, { error: 'Dữ liệu gửi lên không đọc được' });
  if (!checkLogin(env, body.username, body.password)) return denied(env);
  const { rows, errors } = validateRows(body.changes);
  if (errors.length > 0) return json(400, { error: 'Nội dung chưa hợp lệ', errors });
  try {
    await upsertRows(env, rows);
  } catch (err) {
    return json(502, { error: (err as Error).message });
  }
  return json(200, { ok: true, saved: rows.map((r) => r.id) });
}
