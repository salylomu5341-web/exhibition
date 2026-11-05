/**
 * Đọc/ghi bảng nội dung trên Supabase bằng service role key — chỉ chạy trên server (hàm Vercel, script build).
 * Biến môi trường: SUPABASE_SERVICE_ROLE_KEY (bắt buộc), SUPABASE_URL (mặc định dự án dùng chung với website-susu).
 */
export const DEFAULT_SUPABASE_URL = 'https://mlnajumxijnertmgieeh.supabase.co';
export const CONTENT_TABLE = 'mnong_content';

export type Env = Record<string, string | undefined>;

export interface Row {
  id: string;
  data: unknown;
}

function config(env: Env): { url: string; key: string } {
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('thiếu biến môi trường SUPABASE_SERVICE_ROLE_KEY');
  return { url: (env.SUPABASE_URL || DEFAULT_SUPABASE_URL).replace(/\/$/, ''), key };
}

async function call(env: Env, path: string, init: RequestInit = {}): Promise<Response> {
  const { url, key } = config(env);
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', ...init.headers },
  });
  if (!res.ok) throw new Error(`Supabase HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

export async function readRows(env: Env): Promise<Row[]> {
  return (await (await call(env, `${CONTENT_TABLE}?select=id,data`)).json()) as Row[];
}

/** Thêm hoặc ghi đè các dòng (trigger trên bảng giữ bản cũ vào mnong_content_history). */
export async function upsertRows(env: Env, rows: Row[]): Promise<void> {
  if (rows.length === 0) return;
  const now = new Date().toISOString();
  await call(env, `${CONTENT_TABLE}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows.map((r) => ({ id: r.id, data: r.data, updated_at: now }))),
  });
}
