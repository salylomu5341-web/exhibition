import type { Lang, Room } from '../content/schema';
import { t } from '../i18n/lang';
import { textBlocks, type TextBlock } from '../util/text';

/** Khổ tờ A4 đứng (mm). */
export const SHEET_MM = { width: 210, height: 297 } as const;
export const SHEET_RATIO = SHEET_MM.width / SHEET_MM.height;

/** Số ký tự chữ tối đa trên một tờ: tờ đầu của gian còn chỗ cho 3 ảnh, các tờ sau một khung ảnh thấp hơn. */
export const FIRST_BUDGET = 2200;
export const NEXT_BUDGET = 2700;
/** Tiêu đề nhỏ chiếm chỗ như chừng này ký tự (cỡ chữ to hơn, có khoảng trống trên dưới). */
const HEADING_COST = 120;
const FIRST_PHOTOS = 3;
/** Mỗi tờ sau tối đa chừng này ảnh (khung 2×2). */
const NEXT_PHOTOS = 4;

export interface Photo {
  src: string;
  alt: string;
}

export type SheetData =
  | { kind: 'cover' }
  | { kind: 'room'; room: Room; part: number; parts: number; blocks: TextBlock[]; photos: Photo[] }
  | { kind: 'back' };

/** Lời giới thiệu đầy đủ của gian: bảng `gioi-thieu` nếu có, không thì đoạn giới thiệu ngắn. */
export function roomText(room: Room, lang: Lang): string {
  const board = room.exhibits.find((ex) => ex.id === 'gioi-thieu' && ex.type === 'board');
  return t(board && board.type === 'board' ? board.body : room.intro, lang);
}

export function roomPhotos(room: Room, lang: Lang): Photo[] {
  return room.exhibits.flatMap((ex) => (ex.type === 'gallery' ? ex.images.map((img) => ({ src: img.src, alt: t(img.alt, lang) })) : []));
}

const cost = (b: TextBlock) => (b.heading ? HEADING_COST : b.text.length);

/**
 * Chia các đoạn thành từng tờ theo hạn mức ký tự, không cắt giữa đoạn.
 * Đoạn dài hơn hạn mức đứng riêng một tờ; tiêu đề nhỏ không đứng cuối tờ mà sang tờ sau cùng đoạn của nó.
 * Cần nhiều tờ thì san đều chữ giữa các tờ (cùng số tờ), để tờ cuối không chỉ còn vài dòng.
 */
export function splitBlocks(blocks: TextBlock[], first = FIRST_BUDGET, next = NEXT_BUDGET): TextBlock[][] {
  const parts = fill(blocks, first, next);
  if (parts.length < 2) return parts;
  const total = blocks.reduce((sum, b) => sum + cost(b), 0);
  const scale = Math.min(1, (total / (first + (parts.length - 1) * next)) * 1.05);
  const even = fill(blocks, first * scale, next * scale);
  return even.length === parts.length ? even : parts;
}

function fill(blocks: TextBlock[], first: number, next: number): TextBlock[][] {
  const parts: TextBlock[][] = [];
  let current: TextBlock[] = [];
  let used = 0;
  const budget = () => (parts.length === 0 ? first : next);
  for (const block of blocks) {
    if (current.length > 0 && used + cost(block) > budget()) {
      // Kéo các tiêu đề nhỏ đang treo cuối tờ sang tờ mới.
      const carried: TextBlock[] = [];
      while (current.length > 1 && current[current.length - 1].heading) carried.unshift(current.pop()!);
      parts.push(current);
      current = carried;
      used = carried.reduce((sum, b) => sum + cost(b), 0);
    }
    current.push(block);
    used += cost(block);
  }
  if (current.length > 0 || parts.length === 0) parts.push(current);
  return parts;
}

export function roomSheets(room: Room, lang: Lang): SheetData[] {
  const parts = splitBlocks(textBlocks(roomText(room, lang)));
  const photos = roomPhotos(room, lang);
  // Ảnh còn lại san đều cho các tờ sau, theo thứ tự trong gallery.
  const rest = photos.slice(FIRST_PHOTOS);
  const next = parts.length - 1;
  const shown = Math.min(rest.length, next * NEXT_PHOTOS);
  const restOf = (k: number) => rest.slice(Math.ceil((k * shown) / next), Math.ceil(((k + 1) * shown) / next));
  return parts.map((blocks, i) => ({
    kind: 'room',
    room,
    part: i + 1,
    parts: parts.length,
    blocks,
    photos: i === 0 ? photos.slice(0, FIRST_PHOTOS) : restOf(i - 1),
  }));
}

/** Các tờ theo thứ tự in và thứ tự trang sách: bìa, các gian, trang cuối. */
export function buildSheets(rooms: Room[], lang: Lang): SheetData[] {
  return [{ kind: 'cover' }, ...rooms.flatMap((room) => roomSheets(room, lang)), { kind: 'back' }];
}

/** Chỉ số (từ 0) tờ đầu tiên của từng gian. */
export function roomStarts(sheets: SheetData[]): Map<string, number> {
  const starts = new Map<string, number>();
  sheets.forEach((s, i) => {
    if (s.kind === 'room' && s.part === 1) starts.set(s.room.slug, i);
  });
  return starts;
}

/** Gian chứa tờ thứ `index`, để đổi ngôn ngữ (số tờ có thể khác) mà vẫn ở đúng gian. */
export function slugAt(sheets: SheetData[], index: number): string | null {
  const s = sheets[index];
  return s?.kind === 'room' ? s.room.slug : null;
}
