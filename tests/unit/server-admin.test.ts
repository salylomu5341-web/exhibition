import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkLogin, handleContent, handleLogin, handleSave, validateRows } from '../../server/admin';
import { makeRoom, makeSite } from './fixtures';

const env = { SUPABASE_SERVICE_ROLE_KEY: 'khoa-thu', ADMIN_USERNAME: 'admin', ADMIN_PASSWORD: 'dung' };
const login = { username: 'admin', password: 'dung' };
const post = (body: unknown) => new Request('http://x/api/admin/save', { method: 'POST', body: JSON.stringify(body) });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('checkLogin', () => {
  it('đúng cả tên và mật khẩu trong biến môi trường', () => {
    expect(checkLogin(env, 'admin', 'dung')).toBe(true);
    expect(checkLogin(env, 'admin', 'sai')).toBe(false);
    expect(checkLogin(env, 'khac', 'dung')).toBe(false);
    expect(checkLogin(env, undefined, undefined)).toBe(false);
  });
  it('chưa đặt biến thì không ai đăng nhập được', () => {
    expect(checkLogin({}, '', '')).toBe(false);
  });
});

describe('handleLogin', () => {
  it('đúng thì 200, sai thì 401, chưa đặt biến thì 500', async () => {
    const req = (body: unknown) => new Request('http://x/api/admin/login', { method: 'POST', body: JSON.stringify(body) });
    expect((await handleLogin(req(login), env)).status).toBe(200);
    expect((await handleLogin(req({ ...login, password: 'sai' }), env)).status).toBe(401);
    expect((await handleLogin(req(login), {})).status).toBe(500);
  });
});

describe('validateRows', () => {
  it('nhận nội dung đúng schema', () => {
    const { rows, errors } = validateRows([{ id: 'site', data: makeSite() }, { id: makeRoom(1).id, data: makeRoom(1) }]);
    expect(errors).toEqual([]);
    expect(rows.map((r) => r.id)).toEqual(['site', makeRoom(1).id]);
  });
  it('từ chối nội dung sai, id lạ, id không khớp', () => {
    expect(validateRows([{ id: 'site', data: { ...makeSite(), name: { vi: '', mnong: '' } } }]).errors.length).toBeGreaterThan(0);
    expect(validateRows([{ id: '../x', data: {} }]).errors[0]).toMatch(/id không hợp lệ/);
    expect(validateRows([{ id: 'khac', data: makeRoom(1) }]).errors[0]).toMatch(/phải là "khac"/);
    expect(validateRows([]).errors).toHaveLength(1);
  });
});

describe('handleSave', () => {
  it('ghi các dòng hợp lệ lên Supabase bằng service key', async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 201 }));
    vi.stubGlobal('fetch', fetchMock);
    const res = await handleSave(post({ ...login, changes: [{ id: 'site', data: makeSite() }] }), env);
    expect(res.status).toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/rest\/v1\/mnong_content\?on_conflict=id$/);
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer khoa-thu');
    expect(JSON.parse(init.body as string)[0].id).toBe('site');
  });
  it('nội dung sai thì trả 400, không gọi Supabase', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await handleSave(post({ ...login, changes: [{ id: 'site', data: {} }] }), env);
    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('sai mật khẩu thì 401, không gọi Supabase', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await handleSave(post({ ...login, password: 'sai', changes: [{ id: 'site', data: makeSite() }] }), env);
    expect(res.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('handleContent', () => {
  it('trả các dòng đọc được; thiếu service key thì 502', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify([{ id: 'site', data: {} }]))));
    const ok = await handleContent(env);
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual([{ id: 'site', data: {} }]);
    expect((await handleContent({})).status).toBe(502);
  });
});
