import { RoomSchema, SiteSchema, formatIssues, type Room, type Site } from './schema';
import { validateContent } from './validate';

/** Dòng nội dung chung: "site" và mỗi gian một dòng (id = tên file gian). */
export const SITE_ROW = 'site';
/** Hàm Vercel đọc bảng nội dung trên Supabase (api/content.ts). */
export const CONTENT_API = '/api/content';

export interface ContentRow {
  id: string;
  data: unknown;
  updated_at?: string;
}

/** Đọc mọi dòng nội dung đã sửa ở trang quản trị; quá `timeoutMs` thì bỏ. */
export async function fetchContentRows(timeoutMs = 3000): Promise<ContentRow[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(CONTENT_API, { signal: ctrl.signal, cache: 'no-cache' });
    if (!res.ok) throw new Error(`${CONTENT_API}: HTTP ${res.status}`);
    return (await res.json()) as ContentRow[];
  } finally {
    clearTimeout(timer);
  }
}

/** Dựng và kiểm tra nội dung từ các dòng Supabase; thiếu dòng hay sai thì ném lỗi kèm danh sách. */
export function rowsToContent(rows: ContentRow[]): { site: Site; rooms: Room[] } {
  const byId = new Map(rows.map((r) => [r.id, r.data]));
  const siteParsed = SiteSchema.safeParse(byId.get(SITE_ROW));
  if (!siteParsed.success) throw new Error(formatIssues(SITE_ROW, siteParsed.error).join('\n'));
  const site = siteParsed.data;
  const errors: string[] = [];
  const rooms: Room[] = [];
  for (const id of site.rooms) {
    if (!byId.has(id)) {
      errors.push(`${id}: thiếu dòng`);
      continue;
    }
    const parsed = RoomSchema.safeParse(byId.get(id));
    if (!parsed.success) errors.push(...formatIssues(id, parsed.error));
    else if (parsed.data.id !== id) errors.push(`${id} › id: phải là "${id}"`);
    else rooms.push(parsed.data);
  }
  if (errors.length === 0) errors.push(...validateContent(site, rooms));
  if (errors.length > 0) throw new Error(errors.join('\n'));
  return { site, rooms: rooms.sort((a, b) => a.order - b.order) };
}
