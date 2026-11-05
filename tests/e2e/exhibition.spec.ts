import { expect, test } from './fixtures';

const roomIs = (index: number) => `window.__exhibition?.roomIndex === ${index}`;

test('vào nhà dài (qua video giới thiệu) và chuyển gian bằng thanh dưới', async ({ page }) => {
  await page.route('**/www.youtube-nocookie.com/**', (route) => route.abort());
  await page.goto('/');
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Vào nhà dài' }).click();
  await expect(page.locator('.intro-video iframe')).toHaveAttribute('src', /\/embed\/VEc6firsx4c\?autoplay=1/);
  expect(await page.evaluate(() => window.__exhibition!.roomIndex)).toBe(-1);
  await page.getByRole('button', { name: /Bỏ qua/ }).click();
  await expect(page.locator('.intro-video')).toHaveCount(0);
  await page.waitForFunction(roomIs(0));
  await page.locator('.rb-next').click();
  await page.waitForFunction(roomIs(1));
  await expect(page).toHaveURL(/\/phong\/cong-chieng\/$/);
  await expect(page.locator('.rb-current')).toContainText('Văn hóa cồng chiêng');
});

test('link hiện vật mở sẵn khung thông tin, đổi ngôn ngữ', async ({ page }) => {
  await page.goto('/phong/cong-chieng/?v=gioi-thieu');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'cong-chieng/gioi-thieu');
  const title = page.locator('#panel-title');
  await expect(title).toHaveText('Giới thiệu cồng chiêng');
  await expect(page.getByRole('button', { name: /Nghe thuyết minh/ })).toBeVisible();
  await page.getByRole('button', { name: "M'Nông", exact: true }).click();
  await expect(page.getByRole('button', { name: "M'Nông", exact: true })).toHaveAttribute('aria-pressed', 'true');
  // Chữ M'Nông chưa dịch tạm dùng tiếng Việt.
  await expect(title).toHaveText('Giới thiệu cồng chiêng');
  await page.reload();
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await expect(page.getByRole('button', { name: "M'Nông", exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('bấm nút ✕ thì đóng khung thông tin', async ({ page }) => {
  await page.goto('/phong/trang-phuc/?v=anh-trang-phuc');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'trang-phuc/anh-trang-phuc');
  await page.locator('.panel-close').click();
  await expect(page.locator('.panel')).not.toHaveClass(/open/);
  expect(await page.evaluate(() => window.__exhibition!.openKey)).toBeNull();
});

test('video phát ngay trong khung trên vách, rời đi thì dừng', async ({ page }) => {
  await page.route('**/www.youtube-nocookie.com/**', (route) => route.abort());
  await page.goto('/phong/cong-chieng/?v=video-cong-chieng');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'cong-chieng/video-cong-chieng');
  const frame = page.locator('.wall-video iframe');
  await expect(frame).toHaveAttribute('src', /youtube-nocookie\.com\/embed\/NhwifA4SROI\?autoplay=1/);
  await expect(page.locator('.panel')).not.toHaveClass(/open/);
  // Gian cồng chiêng có hai video liền nhau: lùi về bảng ảnh để rời khỏi video.
  await page.locator('.rb-prev').click();
  await expect(frame).toHaveCount(0);
  await expect(page.locator('.wall-video-layer')).toBeHidden();
  await page.evaluate(() => window.__exhibition?.open('cong-chieng/video-cong-chieng'));
  await page.getByRole('button', { name: /Đóng video/ }).click();
  await expect(frame).toHaveCount(0);
});

test('làm hết trắc nghiệm và thấy tổng điểm', async ({ page }) => {
  // 15 câu: chạy song song với các test khác có lúc quá 60 giây mặc định.
  test.setTimeout(120_000);
  await page.goto('/phong/trac-nghiem/?v=cau-hoi');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'trac-nghiem/cau-hoi');
  for (let i = 0; i < 15; i++) {
    await page.locator('.q-options button').first().click();
    await expect(page.locator('.q-feedback')).toBeVisible();
    await page.getByRole('button', { name: 'Câu tiếp' }).click();
  }
  await expect(page.locator('.q-score')).toHaveText(/Bạn trả lời đúng \d+\/15 câu/);
  await page.getByRole('button', { name: 'Chơi lại' }).click();
  await expect(page.locator('.q-progress')).toHaveText('Câu 1/15');
});

test('máy không có WebGL: hiện bản 2D và vẫn mở được hiện vật', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
    } as typeof original;
  });
  await page.goto('/phong/cong-chieng/');
  await page.waitForFunction(() => window.__exhibition?.mode === 'text');
  await expect(page.locator('#text-version h1')).toHaveText('Văn hóa cồng chiêng');
  await page.locator('[data-open="cong-chieng/bo-chieng"]').click();
  await expect(page.locator('#panel-title')).toHaveText('Sáu loại chiêng');
  await expect(page.locator('.p-gongs button')).toHaveCount(6);
});

test('trang gian có đủ thẻ SEO và đúng một h1', async ({ request }) => {
  const html = await (await request.get('/phong/le-cau-mua/')).text();
  expect(html).toContain('<link rel="canonical" href="https://example.com/phong/le-cau-mua/" />');
  expect(html).toContain('property="og:image" content="https://example.com/media/share/le-cau-mua.jpg"');
  expect(html).toContain('"@type":"Museum"');
  expect(html.match(/<h1>/g)).toHaveLength(1);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(9);
  expect(sitemap).toContain('<loc>https://example.com/sach/</loc>');
});
