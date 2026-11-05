import { SHEET_MM } from '../sheets/layout';
import { clamp } from '../util/math';

export const BOOK_PATH = '/sach/';

/** Bề rộng tờ A4 tính theo px CSS (96 px mỗi inch): cỡ gốc của tờ trước khi thu cho vừa trang sách. */
export const SHEET_PX = (SHEET_MM.width / 25.4) * 96;

/** Các trang đang mở (chỉ số từ 0). Bìa đứng riêng, sau đó từng cặp (1, 2), (3, 4)…; trang cuối lẻ đứng riêng. */
export function spreadOf(index: number, count: number, twoPage: boolean): number[] {
  const i = clamp(Math.round(index), 0, count - 1);
  if (!twoPage || i === 0) return [i];
  const start = i % 2 === 1 ? i : i - 1;
  return start + 1 < count ? [start, start + 1] : [start];
}

/** Nhãn số trang đang mở, đánh từ 1: "5" hoặc "2–3". */
export function pageLabel(index: number, count: number, twoPage: boolean): string {
  return spreadOf(index, count, twoPage)
    .map((i) => i + 1)
    .join('–');
}

/** `?trang=N` → chỉ số trang (từ 0), kẹp trong sách; thiếu hoặc sai thì trang đầu. */
export function parsePageParam(search: string, count: number): number {
  const raw = new URLSearchParams(search).get('trang');
  if (!raw || !/^\d+$/.test(raw)) return 0;
  return clamp(Number(raw), 1, count) - 1;
}

export function bookPath(index: number): string {
  return index > 0 ? `${BOOK_PATH}?trang=${index + 1}` : BOOK_PATH;
}

export interface BookLayout {
  twoPage: boolean;
  pageWidth: number;
  blockWidth: number;
}

/** Hiện hai trang khi trang không nhỏ đi quá 15% so với hiện một trang; `ratio` = rộng/cao của trang. */
export function chooseLayout(width: number, height: number, ratio: number): BookLayout {
  const one = Math.min(width, height * ratio);
  const two = Math.min(width / 2, height * ratio);
  const twoPage = two >= 0.85 * one;
  const pageWidth = Math.max(1, Math.floor(twoPage ? two : one));
  return { twoPage, pageWidth, blockWidth: twoPage ? pageWidth * 2 : pageWidth };
}
