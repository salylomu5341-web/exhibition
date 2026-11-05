import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PLACEHOLDER_SITE_URL, SITE_LOCALE, SITE_URL } from '../site.config';
import { BOOK_PATH } from '../src/book/pages';
import { renderBookText, renderHomeText, renderRoomText } from '../src/content/render-html';
import { absUrl, bookJsonLd, museumJsonLd, renderHead, robotsTxt, sitemapXml, type PageMeta } from '../src/content/seo';
import { roomPath } from '../src/nav/route';
import { DIST_DIR } from './lib/paths';
import { readBook, readContent, remoteWanted } from './lib/read-content';
import { validateSiteUrl } from './lib/site-url';

const allowPlaceholder = process.argv.includes('--allow-placeholder-url');
const urlError = validateSiteUrl(SITE_URL, PLACEHOLDER_SITE_URL, allowPlaceholder);
if (urlError) {
  console.error(`✖ ${urlError}`);
  process.exit(1);
}
if (allowPlaceholder && SITE_URL === PLACEHOLDER_SITE_URL) {
  console.warn('⚠ Đang build với SITE_URL mẫu – chỉ dùng để xem thử, không đưa lên server.');
}

async function readTemplate(rel: string): Promise<string> {
  const html = await readFile(path.join(DIST_DIR, rel), 'utf8');
  if (!html.includes('<!--SEO-->') || !html.includes('<!--TEXT-->')) {
    throw new Error(`dist/${rel} thiếu chỗ đánh dấu <!--SEO--> hoặc <!--TEXT-->`);
  }
  return html;
}
const template = await readTemplate('index.html');
const bookTemplate = await readTemplate('sach/index.html');

const { site, rooms } = await readContent({ checkFiles: true, remote: remoteWanted() });
const book = await readBook({ checkFiles: true });
const siteMeta = { siteUrl: SITE_URL, siteName: site.name.vi, locale: SITE_LOCALE };
const jsonLd = museumJsonLd(SITE_URL, site);

const pages: Array<{ meta: PageMeta; text: string; file: string; template: string; jsonLd: unknown }> = [
  {
    meta: { ...site.seo, path: '/' },
    text: renderHomeText(site, rooms, 'vi'),
    file: path.join(DIST_DIR, 'index.html'),
    template,
    jsonLd,
  },
  ...rooms.map((room) => ({
    meta: { ...room.seo, path: roomPath(room.slug) },
    text: renderRoomText(site, rooms, room, 'vi'),
    file: path.join(DIST_DIR, 'phong', room.slug, 'index.html'),
    template,
    jsonLd,
  })),
  {
    meta: { ...book.seo, path: BOOK_PATH },
    text: renderBookText(site, rooms, book, 'vi'),
    file: path.join(DIST_DIR, 'sach', 'index.html'),
    template: bookTemplate,
    jsonLd: bookJsonLd(SITE_URL, site, book),
  },
];

for (const page of pages) {
  // Dùng hàm thay thế để ký tự "$" trong nội dung không bị hiểu là mẫu thay thế.
  const html = page.template
    .replace('<!--SEO-->', () => renderHead(siteMeta, page.meta, page.jsonLd))
    .replace('<!--TEXT-->', () => page.text);
  await mkdir(path.dirname(page.file), { recursive: true });
  await writeFile(page.file, html);
}

await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml(pages.map((p) => absUrl(SITE_URL, p.meta.path))));
await writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt(SITE_URL));
console.log(`Đã tạo ${pages.length} trang HTML, sitemap.xml và robots.txt trong dist/.`);
