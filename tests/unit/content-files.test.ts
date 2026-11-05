import { describe, expect, it } from 'vitest';
import { readBook, readContent } from '../../scripts/lib/read-content';
import { buildSheets, roomStarts } from '../../src/sheets/layout';

describe('nội dung trong public/content', () => {
  it('đọc được, hợp lệ, đủ 7 gian theo thứ tự', async () => {
    const { site, rooms } = await readContent({ checkFiles: false });
    expect(site.rooms).toHaveLength(7);
    expect(rooms.map((r) => r.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('gian 1 có bộ 6 chiêng, gian 6 có góc chụp ảnh, gian 7 có trắc nghiệm', async () => {
    const { rooms } = await readContent({ checkFiles: false });
    expect(rooms[0].exhibits.some((e) => e.type === 'gongs')).toBe(true);
    expect(rooms[5].exhibits.some((e) => e.type === 'costume')).toBe(true);
    expect(rooms[6].exhibits.some((e) => e.type === 'quiz')).toBe(true);
  });

  it('sách đọc được, mỗi gian có ít nhất một tờ', async () => {
    const book = await readBook({ checkFiles: true });
    const { rooms } = await readContent({ checkFiles: false });
    expect(book.title.vi.length).toBeGreaterThan(0);
    const sheets = buildSheets(rooms, 'vi');
    expect(roomStarts(sheets).size).toBe(rooms.length);
  });
});
