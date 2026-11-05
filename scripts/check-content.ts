import { ContentError, readBook, readContent } from './lib/read-content';

try {
  const { site, rooms } = await readContent({ checkFiles: true });
  const book = await readBook({ checkFiles: true });
  const pages = [
    { name: 'Trang chủ', seo: site.seo },
    ...rooms.map((r) => ({ name: `Gian ${r.order}`, seo: r.seo })),
    { name: 'Sách', seo: book.seo },
  ];
  for (const page of pages) {
    if (page.seo.title.length < 50) console.warn(`⚠ ${page.name}: title SEO có ${page.seo.title.length} ký tự (nên 50–60).`);
  }
  const exhibits = rooms.reduce((n, r) => n + r.exhibits.length, 0);
  console.log(`Nội dung hợp lệ: ${rooms.length} gian, ${exhibits} hiện vật, đủ file media.`);
} catch (err) {
  if (err instanceof ContentError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
