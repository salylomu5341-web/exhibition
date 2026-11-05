import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { PLACEHOLDER_SITE_URL, SITE_URL } from '../site.config';
import { esc } from '../src/content/escape';
import { BOOK_PATH } from '../src/book/pages';
import { exhibitUrl, roomPath } from '../src/nav/route';
import { ROOT_DIR } from './lib/paths';
import { readBook, readContent, remoteWanted } from './lib/read-content';
import { validateSiteUrl } from './lib/site-url';

interface QrItem {
  file: string;
  label: string;
  url: string;
}

const PLACEHOLDER_BANNER = 'MẪU – KHÔNG IN (SITE_URL chưa phải tên miền thật)';
const OUT_DIR = path.join(ROOT_DIR, 'qr');

function printSheet(items: QrItem[], banner: string): string {
  const cards = items
    .map((it) => `<figure><img src="${esc(it.file)}.svg" alt="" /><figcaption><b>${esc(it.label)}</b><small>${esc(it.url)}</small></figcaption></figure>`)
    .join('\n');
  return `<!doctype html>
<html lang="vi"><head><meta charset="UTF-8" /><title>Mã QR – Triển lãm M'Nông</title>
<style>
@page { size: A4; margin: 12mm; }
body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; }
main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
figure { margin: 0; border: 1px solid #ccc; border-radius: 4mm; padding: 4mm; text-align: center; break-inside: avoid; }
img { width: 100%; }
figcaption b { display: block; font-size: 11pt; }
figcaption small { display: block; font-size: 7pt; color: #666; word-break: break-all; }
.warn { background: #c00; color: #fff; font: bold 16pt "Segoe UI", Arial, sans-serif; text-align: center; padding: 4mm; margin: 0 0 6mm; }
</style></head>
<body>${banner}<main>
${cards}
</main></body></html>
`;
}

const allowPlaceholder = process.argv.includes('--allow-placeholder-url');
const urlError = validateSiteUrl(SITE_URL, PLACEHOLDER_SITE_URL, allowPlaceholder);
if (urlError) {
  console.error(`✖ ${urlError}`);
  process.exit(1);
}
const isPlaceholder = SITE_URL === PLACEHOLDER_SITE_URL;
if (isPlaceholder) {
  console.warn('⚠ SITE_URL vẫn là giá trị mẫu – mã QR này chỉ để thử, không in.');
}

const { site, rooms } = await readContent({ checkFiles: false, remote: remoteWanted() });
const book = await readBook({ checkFiles: false });
const base = SITE_URL.replace(/\/$/, '');
const items: QrItem[] = [
  { file: 'trang-chinh', label: site.name.vi, url: `${base}/` },
  { file: 'sach', label: `Sách 3D: ${book.title.vi}`, url: `${base}${BOOK_PATH}` },
  ...rooms.flatMap((room) => [
    { file: `gian-${room.order}-${room.slug}`, label: `Gian ${room.order}: ${room.name.vi}`, url: `${base}${roomPath(room.slug)}` },
    ...room.exhibits.map((ex) => ({
      file: `gian-${room.order}-${room.slug}--${ex.id}`,
      label: `Gian ${room.order} · ${ex.title.vi}`,
      url: exhibitUrl(base, room.slug, ex.id),
    })),
  ]),
];

await mkdir(OUT_DIR, { recursive: true });
for (const item of items) {
  await QRCode.toFile(path.join(OUT_DIR, `${item.file}.png`), item.url, { width: 800, margin: 2, errorCorrectionLevel: 'M' });
  await writeFile(path.join(OUT_DIR, `${item.file}.svg`), await QRCode.toString(item.url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }));
}
await writeFile(path.join(OUT_DIR, 'index.html'), printSheet(items, isPlaceholder ? `<p class="warn">${esc(PLACEHOLDER_BANNER)}</p>` : ''));
console.log(`Đã tạo ${items.length} mã QR trong qr/ – mở qr/index.html để in.`);
