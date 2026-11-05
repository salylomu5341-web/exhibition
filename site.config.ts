import { resolveSiteUrl } from './scripts/lib/site-url';

export const PLACEHOLDER_SITE_URL = 'https://example.com';
// Tên miền thật của website. Đổi trước khi chạy `npm run build`, hoặc đặt biến môi trường SITE_URL.
// Khi build trên Vercel mà chưa đổi, tự dùng tên miền production của dự án Vercel.
const CONFIGURED_SITE_URL = 'https://example.com';
export const SITE_URL = resolveSiteUrl(CONFIGURED_SITE_URL, PLACEHOLDER_SITE_URL, process.env);
export const SITE_LOCALE = 'vi_VN';
