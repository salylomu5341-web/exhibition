import { fetchContentRows, rowsToContent } from './remote';
import { applyUiTranslations } from '../i18n/ui-strings';
import { BookSchema, RoomSchema, SiteSchema, type Book, type Room, type Site } from './schema';

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

/** Chờ nội dung đã sửa tối đa chừng này: máy chủ Vercel vừa khởi động lại cộng mạng điện thoại yếu có thể mất vài giây. */
const REMOTE_TIMEOUT_MS = 6000;

/** Nội dung sửa ở trang quản trị nằm trên Supabase; lỗi, chậm hay sai thì dùng bản trong repo (tải song song). */
export async function loadContent(): Promise<{ site: Site; rooms: Room[] }> {
  const content = await loadAnyContent();
  applyUiTranslations(content.site.ui);
  return content;
}

async function loadAnyContent(): Promise<{ site: Site; rooms: Room[] }> {
  const local = loadLocalContent();
  local.catch(() => undefined); // Chỉ dùng khi cần; lỗi của nó báo ở dưới.
  try {
    return rowsToContent(await fetchContentRows(REMOTE_TIMEOUT_MS));
  } catch (err) {
    console.warn('Dùng nội dung dự phòng:', err);
  }
  return local;
}

export async function loadLocalContent(): Promise<{ site: Site; rooms: Room[] }> {
  const site = SiteSchema.parse(await getJson('/content/site.json'));
  const rooms = await Promise.all(
    site.rooms.map(async (id) => RoomSchema.parse(await getJson(`/content/rooms/${id}.json`))),
  );
  return { site, rooms: rooms.sort((a, b) => a.order - b.order) };
}

export async function loadBook(): Promise<Book> {
  return BookSchema.parse(await getJson('/content/book.json'));
}
