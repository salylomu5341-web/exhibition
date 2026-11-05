import { readFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

type Row = { id: string; data: Record<string, unknown> };
type Change = { id: string; data: any };

const read = (rel: string) => JSON.parse(readFileSync(`public/content/${rel}`, 'utf8'));

function contentRows(): Row[] {
  const site = read('site.json');
  return [{ id: 'site', data: site }, ...site.rooms.map((id: string) => ({ id, data: read(`rooms/${id}.json`) }))];
}

/** API giả (hàm Vercel): tài khoản admin / mat-khau-thu; đọc /api/content, đăng nhập, lưu. */
async function fakeApi(page: Page, opts: { rows?: Row[] } = {}) {
  const state = { rows: opts.rows ?? contentRows(), saves: [] as Change[][] };
  await page.route('**/api/content', (route) => route.fulfill({ json: state.rows }));
  const ok = (b: { username?: string; password?: string }) => b.username === 'admin' && b.password === 'mat-khau-thu';
  await page.route('**/api/admin/login', (route) =>
    ok(route.request().postDataJSON()) ? route.fulfill({ json: { ok: true } }) : route.fulfill({ status: 401, json: { error: 'Sai tên đăng nhập hoặc mật khẩu' } }),
  );
  await page.route('**/api/admin/save', async (route) => {
    const body = route.request().postDataJSON();
    if (!ok(body)) return route.fulfill({ status: 401, json: { error: 'Sai tên đăng nhập hoặc mật khẩu' } });
    state.saves.push(body.changes);
    for (const c of body.changes as Change[]) {
      const i = state.rows.findIndex((r) => r.id === c.id);
      if (i >= 0) state.rows[i] = c;
      else state.rows.push(c);
    }
    return route.fulfill({ json: { ok: true } });
  });
  return state;
}

async function signIn(page: Page) {
  await page.goto('/admin/');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('mat-khau-thu');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
}

test('trang quản trị: sai mật khẩu bị chặn; đổi video, sửa đáp án rồi lưu', async ({ page }) => {
  const api = await fakeApi(page);
  await page.goto('/admin/');
  await page.getByLabel('Tên đăng nhập').fill('admin');
  await page.getByLabel('Mật khẩu').fill('sai');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await expect(page.getByRole('alert')).toHaveText('Sai tên đăng nhập hoặc mật khẩu.');
  await signIn(page);
  await expect(page.getByRole('heading', { name: 'Thông tin chung' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lưu thay đổi' })).toBeDisabled();

  await page.getByRole('button', { name: /^Gian 5/ }).click();
  const video = page.locator('input[data-path$="/youtubeId"]').first();
  await video.fill('https://youtu.be/AbCdEfGhIjK?si=x');
  await expect(page.locator('.yt-thumb').first()).toHaveAttribute('src', /AbCdEfGhIjK/);

  await page.getByRole('button', { name: 'Trắc nghiệm', exact: true }).click();
  await page.getByLabel('Đáp án C là đáp án đúng').first().check();

  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('.status')).toHaveText(/Đã lưu/);
  expect(api.saves).toHaveLength(1);
  const saved = Object.fromEntries(api.saves[0].map((c) => [c.id, c.data]));
  expect(Object.keys(saved).sort()).toEqual(['05-hat-mua-xoang-nhac-cu', '07-trac-nghiem']);
  expect(saved['05-hat-mua-xoang-nhac-cu'].exhibits.some((e: any) => e.youtubeId === 'AbCdEfGhIjK')).toBe(true);
  expect(saved['07-trac-nghiem'].exhibits.find((e: any) => e.type === 'quiz').questions[0].answer).toBe(2);
});

test('trang quản trị: ô bỏ trống thì không lưu và tô đỏ', async ({ page }) => {
  const api = await fakeApi(page);
  await signIn(page);
  const name = page.locator('[data-path="site/name/vi"]');
  await name.fill('');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('.status')).toHaveText(/Còn 1 chỗ cần sửa/);
  await expect(name).toHaveClass(/invalid/);
  expect(api.saves).toHaveLength(0);
});

test('trang quản trị lần đầu: đưa nội dung hiện tại lên', async ({ page }) => {
  const api = await fakeApi(page, { rows: [] });
  await signIn(page);
  await page.getByRole('button', { name: 'Đưa nội dung hiện tại lên Supabase' }).click();
  await expect(page.getByRole('heading', { name: 'Thông tin chung' })).toBeVisible();
  expect(api.saves[0].map((c) => c.id)).toHaveLength(8);
});

test('web hiện nội dung đã sửa ở trang quản trị', async ({ page }) => {
  const rows = contentRows();
  (rows[1].data.name as { vi: string }).vi = 'Cồng chiêng (đã sửa)';
  await fakeApi(page, { rows });
  await page.goto('/phong/cong-chieng/');
  await page.waitForFunction(() => window.__exhibition?.roomIndex === 1);
  await expect(page.locator('.rb-current')).toContainText('Cồng chiêng (đã sửa)');
});

test('trang quản trị: dịch chữ trên nút bấm, web hiện bản dịch khi chọn M\'Nông', async ({ page }) => {
  const api = await fakeApi(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Chữ trên nút bấm' }).click();
  await page.locator('[data-path="site/ui/enter"]').fill('Lăp hiu');
  await page.getByRole('button', { name: 'Lưu thay đổi' }).click();
  await expect(page.locator('.status')).toHaveText(/Đã lưu/);
  expect(api.saves[0].find((c) => c.id === 'site')?.data.ui).toEqual({ enter: 'Lăp hiu' });

  await page.goto('/?lang=mnong');
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await expect(page.locator('.intro button.btn')).toHaveText('Lăp hiu');
  await page.getByRole('button', { name: 'VI', exact: true }).click();
  await expect(page.locator('.intro button.btn')).toHaveText('Vào nhà dài');
});
