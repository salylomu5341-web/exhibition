import type { Book, Room, Site } from '../../src/content/schema';

export const L = (vi: string) => ({ vi, mnong: `[M'Nông] ${vi}` });

export function makeRoom(order = 1, overrides: Partial<Room> = {}): Room {
  return {
    id: `0${order}-gian-${order}`,
    slug: `gian-${order}`,
    order,
    name: L(`Gian ${order}`),
    intro: L('Giới thiệu gian'),
    seo: {
      title: `Gian ${order} của người M'Nông – Triển lãm số văn hóa`,
      description: 'Mô tả ngắn cho công cụ tìm kiếm.',
      image: `/media/share/gian-${order}.jpg`,
    },
    exhibits: [
      {
        id: 'gioi-thieu',
        type: 'board',
        position: { wall: 'left', slot: 0 },
        title: L('Giới thiệu'),
        body: L('Đoạn 1\n\nĐoạn 2'),
      },
    ],
    ...overrides,
  };
}

export function makeSite(): Site {
  return {
    name: L('Triển lãm số văn hóa M\'Nông'),
    welcome: L('Chào mừng'),
    seo: { title: 'Trang chủ', description: 'Mô tả', image: '/media/share/home.jpg' },
    rooms: [1, 2, 3, 4, 5, 6, 7].map((o) => `0${o}-gian-${o}`),
  };
}

export const makeRooms = (): Room[] => [1, 2, 3, 4, 5, 6, 7].map((o) => makeRoom(o));

export function makeBook(): Book {
  return {
    title: L('Sách <mẫu>'),
    intro: L('Giới thiệu sách'),
    seo: { title: 'Sách 3D', description: 'Mô tả sách', image: '/media/share/sach.jpg' },
  };
}
