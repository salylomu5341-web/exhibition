import { describe, expect, it } from 'vitest';
import { buildSheets, roomPhotos, roomSheets, roomStarts, roomText, slugAt, splitBlocks } from '../../src/sheets/layout';
import type { TextBlock } from '../../src/util/text';
import { L, makeRoom } from './fixtures';

const p = (n: number, tag = 'x'): TextBlock => ({ heading: false, text: tag.repeat(n) });
const hd = (text: string): TextBlock => ({ heading: true, text });

const gallery = (n: number) => ({
  id: 'anh',
  type: 'gallery' as const,
  position: { wall: 'right' as const, slot: 0 as const },
  title: L('Ảnh'),
  images: Array.from({ length: n }, (_, i) => ({ src: `/media/a/anh-${i + 1}.jpg`, alt: L(`Ảnh ${i + 1}`) })),
});

describe('splitBlocks', () => {
  it('giữ chung một tờ khi còn trong hạn mức', () => {
    expect(splitBlocks([p(100), p(100)], 300, 300)).toEqual([[p(100), p(100)]]);
  });
  it('sang tờ mới khi vượt hạn mức, tờ sau dùng hạn mức riêng', () => {
    const parts = splitBlocks([p(200, 'a'), p(200, 'b'), p(200, 'c'), p(200, 'd')], 300, 500);
    expect(parts).toEqual([[p(200, 'a')], [p(200, 'b'), p(200, 'c')], [p(200, 'd')]]);
  });
  it('đoạn dài hơn hạn mức đứng riêng một tờ, không bị cắt', () => {
    expect(splitBlocks([p(50, 'a'), p(900, 'b'), p(50, 'c')], 300, 300)).toEqual([[p(50, 'a')], [p(900, 'b')], [p(50, 'c')]]);
  });
  it('tiêu đề nhỏ không đứng cuối tờ mà sang tờ sau cùng đoạn của nó', () => {
    const parts = splitBlocks([p(150, 'a'), hd('Mục 2'), p(200, 'b')], 300, 300);
    expect(parts).toEqual([[p(150, 'a')], [hd('Mục 2'), p(200, 'b')]]);
  });
  it('không có chữ vẫn ra một tờ', () => {
    expect(splitBlocks([])).toEqual([[]]);
  });
});

describe('tờ của gian', () => {
  it('lấy lời giới thiệu từ bảng gioi-thieu, không có thì dùng intro của gian', () => {
    expect(roomText(makeRoom(1), 'vi')).toBe('Đoạn 1\n\nĐoạn 2');
    const bare = makeRoom(2, { exhibits: [gallery(1)] });
    expect(roomText(bare, 'mnong')).toBe("[M'Nông] Giới thiệu gian");
  });
  it('tờ đầu tối đa 3 ảnh, ảnh ít hơn số tờ sau thì mỗi tờ 1 ảnh theo thứ tự', () => {
    const long = Array.from({ length: 4 }, () => 'y'.repeat(2000)).join('\n\n');
    const room = makeRoom(1, {
      exhibits: [{ ...makeRoom(1).exhibits[0], type: 'board', body: L(long) } as never, gallery(5)],
    });
    expect(roomPhotos(room, 'vi')).toHaveLength(5);
    const sheets = roomSheets(room, 'vi');
    expect(sheets.length).toBeGreaterThan(2);
    const photos = sheets.map((s) => (s.kind === 'room' ? s.photos.map((ph) => ph.src.slice(-9)) : []));
    expect(photos[0]).toEqual(['anh-1.jpg', 'anh-2.jpg', 'anh-3.jpg']);
    expect(photos[1]).toEqual(['anh-4.jpg']);
    expect(photos[2]).toEqual(['anh-5.jpg']);
    expect(sheets.every((s) => s.kind === 'room' && s.parts === sheets.length)).toBe(true);
  });
  it('ảnh còn lại san đều cho các tờ sau, mỗi tờ tối đa 4 ảnh', () => {
    const long = Array.from({ length: 2 }, () => 'y'.repeat(2400)).join('\n\n');
    const make = (n: number) =>
      roomSheets(makeRoom(1, { exhibits: [{ ...makeRoom(1).exhibits[0], type: 'board', body: L(long) } as never, gallery(n)] }), 'vi').map((s) =>
        s.kind === 'room' ? s.photos.length : 0,
      );
    expect(make(10)).toEqual([3, 4]);
    expect(make(5)).toEqual([3, 2]);
    expect(make(3)).toEqual([3, 0]);
  });
  it('sách: bìa, các gian theo thứ tự, trang cuối; tìm được trang đầu và gian của từng tờ', () => {
    const rooms = [makeRoom(1), makeRoom(2)];
    const sheets = buildSheets(rooms, 'vi');
    expect(sheets.map((s) => s.kind)).toEqual(['cover', 'room', 'room', 'back']);
    expect([...roomStarts(sheets)]).toEqual([
      ['gian-1', 1],
      ['gian-2', 2],
    ]);
    expect(slugAt(sheets, 2)).toBe('gian-2');
    expect(slugAt(sheets, 0)).toBeNull();
  });
});
