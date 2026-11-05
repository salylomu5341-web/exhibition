import { describe, expect, it } from 'vitest';
import { absUrl, bookJsonLd, museumJsonLd, renderHead, robotsTxt, sitemapXml } from '../../src/content/seo';
import { makeBook, makeSite } from './fixtures';

describe('seo', () => {
  it('absUrl ghép tên miền và đường dẫn', () => {
    expect(absUrl('https://a.com', '/phong/x/')).toBe('https://a.com/phong/x/');
    expect(absUrl('https://a.com/', '/')).toBe('https://a.com/');
  });

  it('renderHead có đủ title, description, canonical, Open Graph, Twitter, JSON-LD', () => {
    const head = renderHead(
      { siteUrl: 'https://a.com', siteName: "Triển lãm M'Nông", locale: 'vi_VN' },
      { title: 'Lễ "cầu mùa"', description: 'Mô tả <ngắn>', path: '/phong/le-cau-mua/', image: '/media/share/le-cau-mua.jpg' },
      { '@type': 'Museum', name: '</script>' },
    );
    expect(head).toContain('<title>Lễ &quot;cầu mùa&quot;</title>');
    expect(head).toContain('<meta name="description" content="Mô tả &lt;ngắn&gt;" />');
    expect(head).toContain('<link rel="canonical" href="https://a.com/phong/le-cau-mua/" />');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale', 'og:site_name']) {
      expect(head).toContain(`property="${p}"`);
    }
    expect(head).toContain('content="https://a.com/media/share/le-cau-mua.jpg"');
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('\\u003c/script>');
    expect(head).not.toContain('"</script>"');
  });

  it('museumJsonLd dùng kiểu Museum', () => {
    const ld = museumJsonLd('https://a.com', makeSite()) as Record<string, unknown>;
    expect(ld['@type']).toBe('Museum');
    expect(ld.url).toBe('https://a.com/');
  });

  it('sitemap và robots', () => {
    const xml = sitemapXml(['https://a.com/', 'https://a.com/phong/x/']);
    expect(xml).toContain('<loc>https://a.com/phong/x/</loc>');
    const robots = robotsTxt('https://a.com');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap: https://a.com/sitemap.xml');
  });

  it('bookJsonLd dùng kiểu Book, thuộc Museum của triển lãm', () => {
    const ld = bookJsonLd('https://a.com', makeSite(), makeBook()) as Record<string, any>;
    expect(ld['@type']).toBe('Book');
    expect(ld.url).toBe('https://a.com/sach/');
    expect(ld.image).toBe('https://a.com/media/share/sach.jpg');
    expect(ld.isPartOf['@type']).toBe('Museum');
    expect(ld.isPartOf.url).toBe('https://a.com/');
  });
});
