import { describe, expect, it } from 'vitest';
import { renderBookText, renderHomeText, renderRoomText } from '../../src/content/render-html';
import { L, makeBook, makeRoom, makeRooms, makeSite } from './fixtures';

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('render-html', () => {
  it('trang gian có đúng một h1, mỗi hiện vật một h2, nút mở có data-open', () => {
    const rooms = makeRooms();
    const html = renderRoomText(makeSite(), rooms, rooms[0], 'vi');
    expect(count(html, /<h1>/g)).toBe(1);
    expect(html).toContain('<h1>Gian 1</h1>');
    expect(html).toContain('<h2 id="h-gioi-thieu">Giới thiệu</h2>');
    expect(html).toContain('data-open="gian-1/gioi-thieu"');
    expect(html).toContain('aria-describedby="h-gioi-thieu"');
    expect(html).toContain('<section id="hv-gioi-thieu">');
    expect(html).toContain('<p>Đoạn 1</p><p>Đoạn 2</p>');
  });

  it('tiêu đề nhỏ "## " trong bảng chữ thành h3 nằm dưới h2 của hiện vật', () => {
    const room = makeRoom(1, {
      exhibits: [
        { id: 'gioi-thieu', type: 'board', position: { wall: 'left', slot: 0 }, title: L('Giới thiệu'), body: L('## 1. Khái quát\n\nĐoạn <1>') },
      ],
    });
    const html = renderRoomText(makeSite(), [room], room, 'vi');
    expect(html).toContain('<h2 id="h-gioi-thieu">Giới thiệu</h2><h3>1. Khái quát</h3><p>Đoạn &lt;1&gt;</p>');
  });

  it('chân trang dùng h2 và có link tới 7 gian', () => {
    const rooms = makeRooms();
    const html = renderHomeText(makeSite(), rooms, 'vi');
    expect(count(html, /<h1>/g)).toBe(1);
    expect(html).not.toContain('<h4');
    for (const r of rooms) expect(html).toContain(`href="/phong/${r.slug}/"`);
  });

  it('ảnh có alt, chữ được thoát HTML, theo ngôn ngữ chọn', () => {
    const room = makeRoom(1, {
      name: { vi: 'A <b>', mnong: 'B' },
      exhibits: [
        {
          id: 'anh',
          type: 'gallery',
          position: { wall: 'right', slot: 0 },
          title: L('Ảnh'),
          images: [{ src: '/media/x.jpg', alt: L('Ảnh "đẹp"') }],
        },
      ],
    });
    const vi = renderRoomText(makeSite(), [room], room, 'vi');
    expect(vi).toContain('<h1>A &lt;b&gt;</h1>');
    expect(vi).toContain('alt="Ảnh &quot;đẹp&quot;"');
    expect(renderRoomText(makeSite(), [room], room, 'mnong')).toContain('<h1>B</h1>');
  });

  it('trang chủ có link tới sách', () => {
    expect(renderHomeText(makeSite(), makeRooms(), 'vi')).toContain('href="/sach/"');
  });

  it('bản chữ của sách: một h1, mỗi gian một h2 kèm lời giới thiệu, link tới trang sách và gian, chữ được thoát', () => {
    const html = renderBookText(makeSite(), makeRooms(), makeBook(), 'vi');
    expect(count(html, /<h1>/g)).toBe(1);
    expect(html).toContain('<h1>Sách &lt;mẫu&gt;</h1>');
    expect(count(html, /<section><h2>/g)).toBe(7);
    expect(html).toContain('<p>Đoạn 1</p><p>Đoạn 2</p>');
    // Bìa là trang 1, gian 1 bắt đầu ở trang 2, mỗi gian mẫu một tờ.
    expect(html).toContain('href="/sach/?trang=2"');
    expect(html).toContain('href="/sach/?trang=8"');
    expect(html).toContain('href="/phong/gian-3/"');
    expect(html).toContain('href="/"');
    expect(html).not.toContain('<h4');
  });
});
