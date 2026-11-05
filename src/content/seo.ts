import { esc } from './escape';
import { BOOK_PATH } from '../book/pages';
import type { Book, Site } from './schema';

export interface SiteMeta {
  siteUrl: string;
  siteName: string;
  locale: string;
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image: string;
}

export function absUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).toString();
}

export function renderHead(site: SiteMeta, page: PageMeta, jsonLd: unknown): string {
  const url = absUrl(site.siteUrl, page.path);
  const image = absUrl(site.siteUrl, page.image);
  const meta = (attr: 'name' | 'property', key: string, value: string) => `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return [
    `<title>${esc(page.title)}</title>`,
    meta('name', 'description', page.description),
    `<link rel="canonical" href="${esc(url)}" />`,
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:url', url),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:locale', site.locale),
    meta('property', 'og:site_name', site.siteName),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', image),
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');
}

export function museumJsonLd(siteUrl: string, site: Site): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Museum',
    name: site.name.vi,
    url: absUrl(siteUrl, '/'),
    description: site.seo.description,
    image: absUrl(siteUrl, site.seo.image),
  };
}

export function bookJsonLd(siteUrl: string, site: Site, book: Book): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: book.title.vi,
    url: absUrl(siteUrl, BOOK_PATH),
    description: book.seo.description,
    image: absUrl(siteUrl, book.seo.image),
    inLanguage: 'vi',
    isPartOf: { '@type': 'Museum', name: site.name.vi, url: absUrl(siteUrl, '/') },
  };
}

export function sitemapXml(urls: string[]): string {
  const items = urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${absUrl(siteUrl, '/sitemap.xml')}\n`;
}
