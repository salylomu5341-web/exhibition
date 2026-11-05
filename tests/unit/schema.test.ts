import { describe, expect, it } from 'vitest';
import { RoomSchema, SiteSchema, formatIssues } from '../../src/content/schema';
import { validateContent } from '../../src/content/validate';
import { collectMediaPaths } from '../../src/content/media';
import { L, makeRoom, makeRooms, makeSite } from './fixtures';

const gong = (i: number) => ({ name: L(`Chiêng ${i}`), image: `/media/a/c${i}.png`, sound: `/media/a/c${i}.wav` });

describe('RoomSchema', () => {
  it('chấp nhận gian hợp lệ', () => {
    expect(RoomSchema.safeParse(makeRoom()).success).toBe(true);
  });

  it('báo trùng id hiện vật', () => {
    const room = makeRoom(1);
    room.exhibits.push({ ...room.exhibits[0], position: { wall: 'right', slot: 0 } });
    const r = RoomSchema.safeParse(room);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues('x.json', r.error).join('\n')).toContain('trùng id hiện vật "gioi-thieu"');
  });

  it('báo hai hiện vật cùng vị trí', () => {
    const room = makeRoom(1);
    room.exhibits.push({ ...room.exhibits[0], id: 'khac' });
    const r = RoomSchema.safeParse(room);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues('x.json', r.error).join('\n')).toContain('cùng vị trí left-0');
  });

  it('bộ chiêng phải đúng 6 chiếc', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'bo-chieng', type: 'gongs', position: { wall: 'left', slot: 1 }, title: L('Chiêng'), gongs: [1, 2, 3, 4, 5].map(gong) }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
    room.exhibits = [{ id: 'bo-chieng', type: 'gongs', position: { wall: 'left', slot: 1 }, title: L('Chiêng'), gongs: [1, 2, 3, 4, 5, 6].map(gong) }];
    expect(RoomSchema.safeParse(room).success).toBe(true);
  });

  it('youtubeId phải có 11 ký tự', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'v', type: 'video', position: { wall: 'right', slot: 0 }, title: L('Video'), youtubeId: 'ngan' }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
  });

  it('title SEO tối đa 60 ký tự, ảnh chia sẻ phải là JPG', () => {
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 'x'.repeat(61), description: 'd', image: '/media/s.jpg' } })).success).toBe(false);
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd', image: '/media/s.webp' } })).success).toBe(false);
  });

  it('đường dẫn media phải bắt đầu bằng /media/', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'a', type: 'gallery', position: { wall: 'right', slot: 0 }, title: L('Ảnh'), images: [{ src: 'anh.jpg', alt: L('Ảnh') }] }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
  });
});

describe('RoomSchema – trang phục', () => {
  const withOverlay = (overlay: string) =>
    makeRoom(6, {
      exhibits: [
        {
          id: 'trang-phuc',
          type: 'costume',
          position: { wall: 'left', slot: 0 },
          title: L('Trang phục'),
          costumes: [{ name: L('Nam'), overlay, thumb: '/media/tp/nam-nho.jpg' }],
        },
      ],
    });

  it('overlay phải là PNG', () => {
    expect(RoomSchema.safeParse(withOverlay('/media/tp/nam.png')).success).toBe(true);
    const jpg = RoomSchema.safeParse(withOverlay('/media/tp/nam.jpg'));
    expect(jpg.success).toBe(false);
    if (!jpg.success) expect(formatIssues('x.json', jpg.error).join(' ')).toContain('PNG');
    expect(RoomSchema.safeParse(withOverlay('/media/tp/nam.webp')).success).toBe(false);
  });
});

describe('RoomSchema – đường dẫn media an toàn', () => {
  const withSrc = (src: string) =>
    makeRoom(1, {
      exhibits: [{ id: 'a', type: 'gallery', position: { wall: 'right', slot: 0 }, title: L('Ảnh'), images: [{ src, alt: L('Ảnh') }] }],
    });

  it.each([
    '/media/../x.jpg',
    '/media/a\\b.jpg',
    '/media/a/../../x.jpg',
    '/media/a?x.jpg',
    '/media/a#x.jpg',
    '/media/a%2e.jpg',
    '/media/a b.jpg',
    '/media/.hidden.jpg',
    '/media/a//b.jpg',
    '/media/a.jpg/',
  ])('từ chối %s', (src) => {
    expect(RoomSchema.safeParse(withSrc(src)).success).toBe(false);
  });

  it('chấp nhận đường dẫn con hợp lệ', () => {
    expect(RoomSchema.safeParse(withSrc('/media/gian-1/anh_01.v2.jpg')).success).toBe(true);
  });

  it('ảnh chia sẻ không được chứa ..', () => {
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd', image: '/media/../s.jpg' } })).success).toBe(false);
  });

  it('ảnh chia sẻ phải là .jpg/.jpeg viết thường', () => {
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd', image: '/media/s.jpeg' } })).success).toBe(true);
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd', image: '/media/s.JPG' } })).success).toBe(false);
  });
});

describe('RoomSchema – giới hạn khác', () => {
  const quiz = (options: number, answer: number) =>
    makeRoom(1, {
      exhibits: [
        {
          id: 'q',
          type: 'quiz',
          position: { wall: 'left', slot: 1 },
          title: L('Đố vui'),
          questions: [{ question: L('Hỏi'), options: Array.from({ length: options }, (_, i) => L(`Đáp án ${i}`)), answer, explain: L('Giải thích') }],
        },
      ],
    });

  it('quiz 4 đáp án, answer 0–3 hợp lệ', () => expect(RoomSchema.safeParse(quiz(4, 3)).success).toBe(true));
  it('quiz 3 đáp án không hợp lệ', () => expect(RoomSchema.safeParse(quiz(3, 0)).success).toBe(false));
  it('quiz answer 4 không hợp lệ', () => expect(RoomSchema.safeParse(quiz(4, 4)).success).toBe(false));
  it('description SEO 160 ký tự không hợp lệ', () => {
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd'.repeat(160), image: '/media/s.jpg' } })).success).toBe(false);
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd'.repeat(159), image: '/media/s.jpg' } })).success).toBe(true);
  });
});

describe('validateContent', () => {
  it('không lỗi với nội dung đủ 7 gian', () => {
    expect(validateContent(makeSite(), makeRooms())).toEqual([]);
  });

  it('báo trùng thứ tự và trùng slug', () => {
    const rooms = makeRooms();
    rooms[1] = { ...rooms[1], order: 1, slug: 'gian-1' };
    const errors = validateContent(makeSite(), rooms).join('\n');
    expect(errors).toContain('thứ tự gian');
    expect(errors).toContain('trùng slug "gian-1"');
  });

  it('báo id gian không khớp danh sách trong site.json', () => {
    const rooms = makeRooms();
    rooms[0] = { ...rooms[0], id: 'sai-ten' };
    expect(validateContent(makeSite(), rooms).join('\n')).toContain('"sai-ten"');
  });

  it('báo gian bị liệt kê hai lần trong site.json', () => {
    const site = makeSite();
    site.rooms[6] = site.rooms[0];
    expect(validateContent(site, makeRooms()).join('\n')).toContain('site.json: gian "01-gian-1" bị liệt kê hai lần');
  });
});

describe('collectMediaPaths', () => {
  it('gom mọi chuỗi bắt đầu bằng /media/', () => {
    const paths = collectMediaPaths({ a: '/media/x.jpg', b: ['khong', { c: '/media/y.wav' }], d: 3 });
    expect([...paths].sort()).toEqual(['/media/x.jpg', '/media/y.wav']);
  });
});

describe('SiteSchema', () => {
  it('video giới thiệu là tuỳ chọn, phải là youtubeId 11 ký tự', () => {
    expect(SiteSchema.safeParse(makeSite()).success).toBe(true);
    expect(SiteSchema.safeParse({ ...makeSite(), introVideo: 'WSVL8PrlWlk' }).success).toBe(true);
    expect(SiteSchema.safeParse({ ...makeSite(), introVideo: 'https://youtu.be/WSVL8PrlWlk' }).success).toBe(false);
  });
});
