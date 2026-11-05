import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { collectMediaPaths } from '../../src/content/media';
import { rowsToContent } from '../../src/content/remote';
import { readRows } from '../../server/supabase';
import { BookSchema, RoomSchema, SiteSchema, formatIssues, type Book, type Room, type Site } from '../../src/content/schema';
import { validateContent } from '../../src/content/validate';
import { PUBLIC_DIR, resolveInside } from './paths';

export interface Content {
  site: Site;
  rooms: Room[];
}

export class ContentError extends Error {
  constructor(readonly issues: string[]) {
    super(`Nội dung có ${issues.length} lỗi:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
  }
}

async function readJson(root: string, rel: string, errors: string[]): Promise<unknown> {
  try {
    const text = await readFile(path.join(root, rel), 'utf8');
    // Notepad trên Windows có thể lưu file kèm BOM UTF-8.
    return JSON.parse(text.replace(/^\uFEFF/, ''));
  } catch (err) {
    errors.push(`public/${rel}: không đọc được (${(err as Error).message})`);
    return undefined;
  }
}

/**
 * Kiểm tra file media tồn tại với đúng chữ hoa/thường từng đoạn đường dẫn.
 * Windows bỏ qua chữ hoa/thường, còn máy chủ Linux thì không, nên phải so khớp thủ công.
 */
async function checkMediaFiles(root: string, mediaPaths: Iterable<string>, errors: string[]): Promise<void> {
  const listings = new Map<string, Promise<string[]>>();
  const list = (dir: string): Promise<string[]> => {
    let entries = listings.get(dir);
    if (!entries) {
      entries = readdir(dir).catch(() => []);
      listings.set(dir, entries);
    }
    return entries;
  };

  for (const media of mediaPaths) {
    try {
      resolveInside(root, media);
    } catch (err) {
      errors.push(`${media}: ${(err as Error).message}`);
      continue;
    }
    let dir = root;
    let caseOnly = false;
    let found = true;
    for (const segment of media.split('/').filter(Boolean)) {
      const entries = await list(dir);
      if (entries.includes(segment)) {
        dir = path.join(dir, segment);
        continue;
      }
      found = false;
      caseOnly = entries.some((e) => e.toLowerCase() === segment.toLowerCase());
      break;
    }
    if (!found) errors.push(`thiếu file public${media}${caseOnly ? ' (kiểm tra chữ hoa/thường)' : ''}`);
  }
}

/** Build trên Vercel (hoặc đặt CONTENT_SOURCE=supabase) thì lấy nội dung đã sửa ở trang quản trị. */
export const remoteWanted = (env: NodeJS.ProcessEnv = process.env): boolean =>
  env.CONTENT_SOURCE === 'supabase' || (env.VERCEL === '1' && env.CONTENT_SOURCE !== 'local');

/**
 * `remote`: lấy nội dung từ Supabase, lỗi hay không hợp lệ thì in cảnh báo và đọc file trong `root`.
 */
export async function readContent(opts: { checkFiles: boolean; root?: string; remote?: boolean }): Promise<Content> {
  const root = opts.root ?? PUBLIC_DIR;
  if (opts.remote) {
    try {
      const content = rowsToContent(await readRows(process.env));
      if (opts.checkFiles) {
        const errors: string[] = [];
        await checkMediaFiles(root, collectMediaPaths(content), errors);
        if (errors.length > 0) throw new ContentError(errors);
      }
      console.log('Nội dung lấy từ Supabase.');
      return content;
    } catch (err) {
      console.warn(`Không dùng được nội dung trên Supabase, dùng file trong repo.\n${(err as Error).message}`);
    }
  }
  const errors: string[] = [];
  const siteRaw = await readJson(root, 'content/site.json', errors);
  if (siteRaw === undefined) throw new ContentError(errors);
  const siteParsed = SiteSchema.safeParse(siteRaw);
  if (!siteParsed.success) throw new ContentError(formatIssues('content/site.json', siteParsed.error));
  const site = siteParsed.data;

  const rooms: Room[] = [];
  for (const id of site.rooms) {
    const file = `content/rooms/${id}.json`;
    const raw = await readJson(root, file, errors);
    if (raw === undefined) continue;
    const parsed = RoomSchema.safeParse(raw);
    if (!parsed.success) errors.push(...formatIssues(file, parsed.error));
    else if (parsed.data.id !== id) errors.push(`${file} › id: phải là "${id}" (trùng tên file)`);
    else rooms.push(parsed.data);
  }

  if (errors.length === 0) errors.push(...validateContent(site, rooms));

  if (opts.checkFiles && errors.length === 0) {
    await checkMediaFiles(root, collectMediaPaths({ site, rooms }), errors);
  }

  if (errors.length > 0) throw new ContentError(errors);
  rooms.sort((a, b) => a.order - b.order);
  return { site, rooms };
}

/** Đọc và kiểm tra `content/book.json`; `checkFiles` kiểm tra thêm ảnh bìa và ảnh chia sẻ. */
export async function readBook(opts: { checkFiles: boolean; root?: string }): Promise<Book> {
  const root = opts.root ?? PUBLIC_DIR;
  const errors: string[] = [];
  const raw = await readJson(root, 'content/book.json', errors);
  if (raw === undefined) throw new ContentError(errors);
  const parsed = BookSchema.safeParse(raw);
  if (!parsed.success) throw new ContentError(formatIssues('content/book.json', parsed.error));
  const book = parsed.data;
  if (opts.checkFiles) {
    await checkMediaFiles(root, collectMediaPaths(book), errors);
  }
  if (errors.length > 0) throw new ContentError(errors);
  return book;
}
