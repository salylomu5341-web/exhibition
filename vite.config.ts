import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import { PLACEHOLDER_SITE_URL, SITE_URL } from './site.config';

const page = (rel: string) => fileURLToPath(new URL(rel, import.meta.url));

export default defineConfig({
  // Tên miền in trong mã QR của tờ in và trang sách.
  define: {
    __SITE_URL__: JSON.stringify(SITE_URL),
    __SITE_URL_IS_SAMPLE__: JSON.stringify(SITE_URL.replace(/\/$/, '') === PLACEHOLDER_SITE_URL),
  },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 900,
    // Mỗi trang một bundle: nhà dài 3D (/), sách 3D lật (/sach/), tờ in theo gian (/in/) và trang quản trị (/admin/).
    rollupOptions: {
      input: { main: page('index.html'), sach: page('sach/index.html'), in: page('in/index.html'), admin: page('admin/index.html') },
    },
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
