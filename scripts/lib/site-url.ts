/**
 * Kiểm tra SITE_URL. Trả về thông báo lỗi tiếng Việt, hoặc null nếu hợp lệ.
 * Hàm thuần: không đọc file, không in ra màn hình.
 */
export function validateSiteUrl(url: string, placeholder: string, allowPlaceholder: boolean): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `SITE_URL "${url}" không phải địa chỉ web hợp lệ. Ghi dạng https://ten-mien-cua-ban.vn`;
  }
  if (parsed.protocol !== 'https:') {
    return `SITE_URL "${url}" phải bắt đầu bằng https:// (camera chụp ảnh và AR chỉ chạy trên HTTPS).`;
  }
  if (parsed.pathname !== '/' || parsed.search !== '' || parsed.hash !== '' || /[?#]/.test(url)) {
    return `SITE_URL "${url}" chỉ được là tên miền, không kèm đường dẫn, dấu ? hay dấu #. Ví dụ: https://ten-mien-cua-ban.vn`;
  }
  if (!allowPlaceholder && stripSlash(url) === stripSlash(placeholder)) {
    return `SITE_URL vẫn là giá trị mẫu (${placeholder}). Điền tên miền thật vào site.config.ts hoặc biến môi trường SITE_URL rồi chạy lại.`;
  }
  return null;
}

function stripSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

/**
 * Chọn SITE_URL dùng khi build. Thứ tự ưu tiên: biến môi trường SITE_URL,
 * giá trị ghi trong site.config.ts (nếu đã đổi khỏi giá trị mẫu), tên miền
 * production mà Vercel tự cấp khi build trên Vercel, cuối cùng là giá trị mẫu.
 */
export function resolveSiteUrl(configured: string, placeholder: string, env: Record<string, string | undefined>): string {
  const fromEnv = env.SITE_URL?.trim();
  if (fromEnv) return fromEnv;
  if (stripSlash(configured) !== stripSlash(placeholder)) return configured;
  const vercelHost = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelHost) return `https://${vercelHost}`;
  return configured;
}
