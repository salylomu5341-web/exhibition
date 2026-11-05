import { expect, test } from './fixtures';

const bookReady = () => window.__book !== undefined && window.__book.pageCount > 0;

test('mở sách ở trang trong link, lật trang thì địa chỉ đổi theo', async ({ page }) => {
  await page.goto('/sach/?trang=2');
  await page.waitForFunction(bookReady);
  expect(await page.evaluate(() => window.__book!.page)).toBe(2);
  const count = await page.evaluate(() => window.__book!.pageCount);
  await expect(page.locator('.book-bar .rb-current')).toContainText(`/ ${count}`);
  // Trang 2 là tờ đầu của gian 1: có tên gian và mã QR dẫn vào gian.
  await expect(page.locator('.sheet[data-room="cong-chieng"][data-part^="1/"] .sh-title')).toHaveText('Văn hóa cồng chiêng');
  await expect(page.locator('.sheet[data-room="cong-chieng"][data-part^="1/"] a.sh-qr')).toHaveAttribute('href', '/phong/cong-chieng/');
  await page.getByRole('button', { name: 'Trang sau' }).click();
  await page.waitForFunction(() => window.__book!.page > 2);
  await expect(page).toHaveURL(/\/sach\/\?trang=(3|4)$/);
});

test("mục lục nhảy tới gian, đổi M'Nông vẫn ở đúng gian", async ({ page }) => {
  await page.goto('/sach/');
  await page.waitForFunction(bookReady);
  await page.getByRole('button', { name: /Mục lục/ }).click();
  await expect(page.locator('#panel-title')).toHaveText('Mục lục');
  await expect(page.locator('.toc-item')).toHaveCount(7);
  const item = page.locator('.toc-item').nth(5);
  await expect(item).toContainText('Trang phục');
  const target = Number(await item.locator('.toc-page').textContent());
  await item.click();
  await expect(page.locator('.panel')).not.toHaveClass(/open/);
  const shown = await page.evaluate(() => window.__book!.page);
  expect([target - 1, target]).toContain(shown);

  await page.getByRole('button', { name: "M'Nông", exact: true }).click();
  await expect(page.locator('.sheet[data-room="trang-phuc"] .sh-title').first()).toHaveText('Trang phục');
  await expect(page.getByRole('button', { name: "M'Nông", exact: true })).toHaveAttribute('aria-pressed', 'true');
  const start = await page.evaluate(() => [...document.querySelectorAll('.sheet')].findIndex((s) => (s as HTMLElement).dataset.room === 'trang-phuc') + 1);
  expect([start - 1, start]).toContain(await page.evaluate(() => window.__book!.page));
});

test('trang in: mỗi gian có tờ kèm mã QR, không cho Google tìm', async ({ page }) => {
  await page.goto('/in/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('#sheets .sheet-cover')).toHaveCount(1);
  await expect(page.locator('#sheets .sheet-back')).toHaveCount(1);
  // Trang cuối có hai mã: vào nhà dài và đọc sách trực tuyến.
  await expect(page.locator('#sheets .sheet-back a.sh-qr-card[href="/"] svg')).toBeVisible();
  await expect(page.locator('#sheets .sheet-back a.sh-qr-card[href="/sach/"] svg')).toBeVisible();
  await expect(page.locator('#sheets .sheet-cover .sh-cover-img')).toHaveAttribute('src', '/media/sach/bia.jpg');
  for (const slug of ['cong-chieng', 'le-cau-mua', 'trang-phuc', 'trac-nghiem']) {
    await expect(page.locator(`#sheets .sheet[data-room="${slug}"] .sh-qr svg`).first()).toBeVisible();
  }
  // build:preview dùng tên miền mẫu nên trang báo không được in.
  await expect(page.locator('.print-warn')).toBeVisible();
  await page.locator('#print-bar select').selectOption('a3');
  await expect(page).toHaveURL(/\?kho=a3$/);
});

test('trang sách có đủ thẻ SEO, kiểu Book và đúng một h1; trang chủ có link tới sách', async ({ request }) => {
  const html = await (await request.get('/sach/')).text();
  expect(html).toContain('<link rel="canonical" href="https://example.com/sach/" />');
  expect(html).toContain('property="og:image" content="https://example.com/media/share/sach.jpg"');
  expect(html).toContain('"@type":"Book"');
  expect(html).toContain('href="/sach/?trang=2"');
  expect(html.match(/<h1>/g)).toHaveLength(1);
  const home = await (await request.get('/')).text();
  expect(home).toContain('href="/sach/"');
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).not.toContain('/in/');
});
