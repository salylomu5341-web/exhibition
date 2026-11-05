import { ROOM_COUNT, type Room, type Site } from './schema';

/** Kiểm tra những ràng buộc giữa các file mà schema từng file không thấy được. */
export function validateContent(site: Site, rooms: Room[]): string[] {
  const errors: string[] = [];

  const listed = new Set<string>();
  for (const id of site.rooms) {
    if (listed.has(id)) errors.push(`site.json: gian "${id}" bị liệt kê hai lần`);
    listed.add(id);
  }

  for (const room of rooms) {
    if (!site.rooms.includes(room.id)) {
      errors.push(`gian có id "${room.id}" không khớp tên file trong site.json`);
    }
  }

  const orders = rooms.map((r) => r.order).sort((a, b) => a - b);
  const expected = Array.from({ length: ROOM_COUNT }, (_, i) => i + 1);
  if (orders.join(',') !== expected.join(',')) {
    errors.push(`thứ tự gian (order) phải là 1–${ROOM_COUNT}, mỗi số một lần; đang có: ${orders.join(', ')}`);
  }

  const slugs = new Set<string>();
  for (const room of rooms) {
    if (slugs.has(room.slug)) errors.push(`trùng slug "${room.slug}"`);
    slugs.add(room.slug);
  }

  return errors;
}
