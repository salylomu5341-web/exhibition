import { fetchContentRows, type ContentRow } from '../content/remote';

export interface Login {
  username: string;
  password: string;
}

/** Lỗi gọi API; `auth` là sai tên đăng nhập/mật khẩu, `invalid` là nội dung chưa hợp lệ. */
export class ApiError extends Error {
  constructor(
    readonly kind: 'auth' | 'invalid' | 'network',
    message: string,
  ) {
    super(message);
  }
}

async function post(path: string, body: unknown): Promise<void> {
  let res: Response;
  try {
    res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch (err) {
    throw new ApiError('network', (err as Error).message);
  }
  if (res.ok) return;
  const data = (await res.json().catch(() => ({}))) as { error?: string; errors?: string[] };
  const message = [data.error ?? `HTTP ${res.status}`, ...(data.errors ?? []).slice(0, 5)].join('\n');
  throw new ApiError(res.status === 401 ? 'auth' : res.status === 400 ? 'invalid' : 'network', message);
}

/** Đúng tên và mật khẩu (biến môi trường trên Vercel) thì xong, sai thì ném ApiError('auth'). */
export const checkLogin = (l: Login) => post('/api/admin/login', l);
export const saveRows = (l: Login, changes: Array<{ id: string; data: unknown }>) => post('/api/admin/save', { ...l, changes });

export async function loadRows(): Promise<ContentRow[]> {
  try {
    return await fetchContentRows(10_000);
  } catch (err) {
    throw new ApiError('network', `Không đọc được nội dung: ${(err as Error).message}`);
  }
}
