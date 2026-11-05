import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * Chặn Supabase để mọi test chạy trên nội dung trong repo; test nào cần thì tự `page.route` đè lên.
 * WebSocket của khách ảo (Realtime) bị từ chối ngay trong trang: chặn bằng `routeWebSocket` để kênh treo
 * làm trình duyệt hay đóng giữa chừng khi chạy nhiều test cùng lúc. Test khách ảo dùng `realtimeTest`.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.route(/\.supabase\.co\//, (route) => route.abort());
    await page.addInitScript(() => {
      const Real = window.WebSocket;
      window.WebSocket = class extends Real {
        constructor(url: string | URL, protocols?: string | string[]) {
          if (String(url).includes('.supabase.co')) throw new Error('Realtime bị chặn trong test');
          super(url, protocols);
        }
      } as typeof WebSocket;
    });
    await use(page);
  },
});

/** Cho test khách ảo: chỉ chặn HTTP tới Supabase, WebSocket do test tự `routeWebSocket`. */
export const realtimeTest = base.extend({
  page: async ({ page }, use) => {
    await page.route(/\.supabase\.co\//, (route) => route.abort());
    await use(page);
  },
});
