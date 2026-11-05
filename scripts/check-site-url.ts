import { PLACEHOLDER_SITE_URL, SITE_URL } from '../site.config';
import { validateSiteUrl } from './lib/site-url';

// Chạy đầu tiên trong `npm run build`, để lỗi SITE_URL không để lại thư mục dist/ dang dở.
const allowPlaceholder = process.argv.includes('--allow-placeholder-url');
const error = validateSiteUrl(SITE_URL, PLACEHOLDER_SITE_URL, allowPlaceholder);
if (error) {
  console.error(`✖ ${error}`);
  process.exit(1);
}
if (allowPlaceholder && SITE_URL.replace(/\/+$/, '') === PLACEHOLDER_SITE_URL.replace(/\/+$/, '')) {
  console.warn('⚠ Đang dùng SITE_URL mẫu – chỉ để xem thử, không đưa lên server.');
}
