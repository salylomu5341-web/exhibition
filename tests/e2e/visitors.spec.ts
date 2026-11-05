import { expect, realtimeTest as test } from './fixtures';

const TOPIC = 'realtime:mnong-visitors';

test('khách ảo: vào nhà mới kết nối, thấy số người và hình người của khách khác ở sảnh', async ({ page }) => {
  // Giả máy chủ Supabase Realtime: trả lời join, báo có hai khách khác đang đứng trong sảnh.
  let connects = 0;
  await page.routeWebSocket(/\.supabase\.co\/realtime\//, (ws) => {
    connects++;
    ws.onMessage((raw) => {
      const msg = JSON.parse(String(raw)) as { event: string; ref: string };
      const send = (event: string, payload: unknown, ref: string | null = null) => ws.send(JSON.stringify({ topic: TOPIC, event, payload, ref }));
      // Giống Supabase thật: câu trả lời không kèm join_ref.
      if (msg.event === 'phx_join') {
        send('phx_reply', { status: 'ok', response: {} }, msg.ref);
        send('presence_state', {
          a1b2c3: { metas: [{ phx_ref: 'r1', n: 12, c: 2 }] },
          d4e5f6: { metas: [{ phx_ref: 'r2', n: 34, c: 0 }] },
        });
        send('broadcast', { type: 'broadcast', event: 'pos', payload: { i: 'a1b2c3', x: 4.5, z: -1.5, y: 0 } });
        send('broadcast', { type: 'broadcast', event: 'pos', payload: { i: 'd4e5f6', x: 5, z: 1.5, y: 1 } });
      }
    });
  });
  await page.goto('/?lang=vi');
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  const counter = page.locator('.tb-visitors');
  // Còn ở sân trước: chưa tải mã Realtime, chưa kết nối.
  await page.waitForTimeout(500);
  expect(connects).toBe(0);
  await expect(counter).toHaveCount(0);
  await page.evaluate(() => window.__exhibition!.goTo(0));
  // Tải mã Realtime và vào kênh mất vài giây khi máy chạy nhiều test cùng lúc.
  await expect(counter).toBeVisible({ timeout: 30_000 });
  await expect(counter.locator('.tb-count')).toHaveText('3', { timeout: 30_000 });
  await page.waitForFunction(() => window.__exhibition!.visitors?.shown === 2);
  expect(connects).toBe(1);
  // Bấm nút đếm: ẩn khách khác.
  await counter.click();
  await expect(counter).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => window.__exhibition!.visitors?.shown)).toBe(0);
});

test('khách ảo: Realtime bị chặn thì không hiện nút đếm, nhà dài vẫn chạy', async ({ page }) => {
  // Trang tự thử kết nối lại; lần thử rơi đúng lúc test đóng trang thì close() báo lỗi, bỏ qua.
  await page.routeWebSocket(/\.supabase\.co\//, (ws) => ws.close().catch(() => {}));
  await page.goto('/');
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await page.evaluate(() => window.__exhibition!.goTo(1));
  await page.waitForFunction(() => window.__exhibition?.roomIndex === 1);
  await page.waitForFunction(() => window.__exhibition!.visitors != null);
  await expect(page.locator('.tb-visitors')).toBeHidden();
  expect(await page.evaluate(() => window.__exhibition!.visitors?.count)).toBe(0);
});
