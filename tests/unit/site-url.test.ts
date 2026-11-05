import { describe, expect, it } from 'vitest';
import { resolveSiteUrl, validateSiteUrl } from '../../scripts/lib/site-url';

const PLACEHOLDER = 'https://example.com';

describe('validateSiteUrl', () => {
  it('chấp nhận tên miền https thật, có hoặc không có dấu / cuối', () => {
    expect(validateSiteUrl('https://trienlam.vn', PLACEHOLDER, false)).toBeNull();
    expect(validateSiteUrl('https://trienlam.vn/', PLACEHOLDER, false)).toBeNull();
  });

  it('từ chối giá trị mẫu, trừ khi được cho phép', () => {
    expect(validateSiteUrl(PLACEHOLDER, PLACEHOLDER, false)).toContain('giá trị mẫu');
    expect(validateSiteUrl(`${PLACEHOLDER}/`, PLACEHOLDER, false)).toContain('giá trị mẫu');
    expect(validateSiteUrl(PLACEHOLDER, PLACEHOLDER, true)).toBeNull();
  });

  it('từ chối chuỗi không phải địa chỉ web', () => {
    expect(validateSiteUrl('trienlam.vn', PLACEHOLDER, false)).toContain('không phải địa chỉ web hợp lệ');
    expect(validateSiteUrl('', PLACEHOLDER, true)).not.toBeNull();
  });

  it('từ chối http và giao thức khác, kể cả khi cho phép giá trị mẫu', () => {
    expect(validateSiteUrl('http://trienlam.vn', PLACEHOLDER, false)).toContain('https://');
    expect(validateSiteUrl('http://example.com', PLACEHOLDER, true)).toContain('https://');
    expect(validateSiteUrl('ftp://trienlam.vn', PLACEHOLDER, false)).toContain('https://');
  });

  it('từ chối đường dẫn, query và hash', () => {
    expect(validateSiteUrl('https://trienlam.vn/trang', PLACEHOLDER, false)).toContain('không kèm đường dẫn');
    expect(validateSiteUrl('https://trienlam.vn/?a=1', PLACEHOLDER, false)).toContain('không kèm đường dẫn');
    expect(validateSiteUrl('https://trienlam.vn?a=1', PLACEHOLDER, false)).toContain('không kèm đường dẫn');
    expect(validateSiteUrl('https://trienlam.vn/#x', PLACEHOLDER, false)).toContain('không kèm đường dẫn');
    expect(validateSiteUrl('https://trienlam.vn#', PLACEHOLDER, false)).toContain('không kèm đường dẫn');
  });
});

describe('resolveSiteUrl', () => {
  it('ưu tiên biến môi trường SITE_URL', () => {
    expect(resolveSiteUrl('https://trienlam.vn', PLACEHOLDER, { SITE_URL: 'https://khac.vn', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://khac.vn');
  });

  it('dùng giá trị trong site.config.ts khi đã đổi khỏi giá trị mẫu', () => {
    expect(resolveSiteUrl('https://trienlam.vn', PLACEHOLDER, { VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' })).toBe('https://trienlam.vn');
  });

  it('dùng tên miền production của Vercel khi config còn là giá trị mẫu', () => {
    expect(resolveSiteUrl(PLACEHOLDER, PLACEHOLDER, { VERCEL_PROJECT_PRODUCTION_URL: 'trien-lam.vercel.app' })).toBe('https://trien-lam.vercel.app');
  });

  it('giữ giá trị mẫu khi không có gì khác, để bước kiểm tra chặn build', () => {
    expect(resolveSiteUrl(PLACEHOLDER, PLACEHOLDER, { SITE_URL: '  ' })).toBe(PLACEHOLDER);
  });
});
