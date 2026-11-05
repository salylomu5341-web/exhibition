import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../site.config';

describe('khung dự án', () => {
  it('có SITE_URL', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });
});
