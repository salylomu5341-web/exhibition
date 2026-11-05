import { describe, expect, it } from 'vitest';
import { bookPath, chooseLayout, pageLabel, parsePageParam, spreadOf } from '../../src/book/pages';
import { BookSchema } from '../../src/content/schema';
import { SHEET_RATIO } from '../../src/sheets/layout';
import { L } from './fixtures';

const book = (over: Record<string, unknown> = {}) => ({
  title: L('Sách'),
  intro: L('Giới thiệu'),
  seo: { title: 'Sách 3D', description: 'Mô tả', image: '/media/share/sach.jpg' },
  ...over,
});

describe('BookSchema', () => {
  it('nhận sách hợp lệ, ảnh bìa là tuỳ chọn', () => {
    expect(BookSchema.safeParse(book()).success).toBe(true);
    expect(BookSchema.safeParse(book({ cover: '/media/sach/bia.jpg' })).success).toBe(true);
  });
  it('từ chối ảnh bìa ngoài /media/', () => {
    expect(BookSchema.safeParse(book({ cover: 'https://a.com/bia.jpg' })).success).toBe(false);
  });
});

describe('trang sách', () => {
  it('spreadOf: bìa đứng riêng, sau đó từng cặp, trang cuối lẻ đứng riêng', () => {
    expect(spreadOf(0, 6, true)).toEqual([0]);
    expect(spreadOf(1, 6, true)).toEqual([1, 2]);
    expect(spreadOf(2, 6, true)).toEqual([1, 2]);
    expect(spreadOf(5, 6, true)).toEqual([5]);
    expect(spreadOf(4, 7, true)).toEqual([3, 4]);
    expect(spreadOf(3, 6, false)).toEqual([3]);
    expect(spreadOf(99, 6, false)).toEqual([5]);
  });
  it('pageLabel đánh số từ 1', () => {
    expect(pageLabel(1, 6, true)).toBe('2–3');
    expect(pageLabel(0, 6, true)).toBe('1');
    expect(pageLabel(4, 6, false)).toBe('5');
  });
  it('parsePageParam kẹp trong sách, sai thì về trang đầu', () => {
    expect(parsePageParam('?trang=5', 10)).toBe(4);
    expect(parsePageParam('?trang=99', 10)).toBe(9);
    expect(parsePageParam('?trang=0', 10)).toBe(0);
    expect(parsePageParam('?trang=abc', 10)).toBe(0);
    expect(parsePageParam('', 10)).toBe(0);
  });
  it('bookPath bỏ ?trang ở trang đầu', () => {
    expect(bookPath(0)).toBe('/sach/');
    expect(bookPath(4)).toBe('/sach/?trang=5');
  });
  it('chooseLayout: máy tính hai trang, điện thoại dọc và tablet dọc một trang', () => {
    const r = SHEET_RATIO;
    expect(chooseLayout(1240, 520, r).twoPage).toBe(true);
    expect(chooseLayout(375, 690, r)).toMatchObject({ twoPage: false, pageWidth: 375, blockWidth: 375 });
    expect(chooseLayout(768, 900, r).twoPage).toBe(false);
    const wide = chooseLayout(800, 300, r);
    expect(wide.twoPage).toBe(true);
    expect(wide.blockWidth).toBe(wide.pageWidth * 2);
  });
});
