import { ROOM_COUNT } from '../content/schema';
import { clamp } from '../util/math';

export const HALL_LENGTH = 6;
export const ROOM_LENGTH = 9;
export const HOUSE_LENGTH = HALL_LENGTH + ROOM_LENGTH * ROOM_COUNT;
export const HALF_WIDTH = 5;
export const WALL_HEIGHT = 3.2;
export const EYE_HEIGHT = 1.6;
export const DOOR_HALF_WIDTH = 1.4;
/** Hướng nhìn dọc nhà, về phía cuối nhà (+x). */
export const FACE_FORWARD = -Math.PI / 2;

const WALL_INSET = 0.12;
const VIEW_Z = 1.2;

export interface Point {
  x: number;
  z: number;
}
export interface Standpoint extends Point {
  id: string;
  /** −1 sân trước, 0 sảnh, 1–7 các gian. */
  roomIndex: number;
}
export interface Anchor extends Point {
  /** rotation.y để mặt trước (+z cục bộ) quay ra lối giữa. */
  facing: number;
}

export function roomStartX(order: number): number {
  return HALL_LENGTH + (order - 1) * ROOM_LENGTH;
}

export function roomIndexAt(x: number): number {
  if (x < 0) return -1;
  if (x < HALL_LENGTH) return 0;
  return Math.min(ROOM_COUNT, Math.floor((x - HALL_LENGTH) / ROOM_LENGTH) + 1);
}

export function standpoints(): Standpoint[] {
  const list: Standpoint[] = [
    { id: 'san-truoc', roomIndex: -1, x: -9, z: 0 },
    { id: 'sanh', roomIndex: 0, x: 3, z: 0 },
  ];
  for (let order = 1; order <= ROOM_COUNT; order++) {
    const start = roomStartX(order);
    list.push({ id: `gian-${order}-a`, roomIndex: order, x: start + 2.5, z: 0 });
    list.push({ id: `gian-${order}-b`, roomIndex: order, x: start + 6.5, z: 0 });
  }
  return list;
}

export function exhibitAnchor(order: number, wall: 'left' | 'right', slot: number): Anchor {
  return {
    x: roomStartX(order) + 1.5 + slot * 3,
    z: wall === 'left' ? -HALF_WIDTH + WALL_INSET : HALF_WIDTH - WALL_INSET,
    facing: wall === 'left' ? 0 : Math.PI,
  };
}

export function viewpointFor(anchor: Point): Point {
  return { x: anchor.x, z: anchor.z < 0 ? -VIEW_Z : VIEW_Z };
}

/** Chỗ đứng nhìn thẳng vào hiện vật, cách vách `distance` m, không xa hơn chỗ đứng thường. */
export function viewpointAt(anchor: Point, distance: number): Point {
  const fromWall = Math.abs(anchor.z);
  const d = clamp(distance, 0, fromWall - VIEW_Z);
  return { x: anchor.x, z: Math.sign(anchor.z) * (fromWall - d) };
}

export function clampToWalkable(x: number, z: number, inside: boolean): Point {
  if (inside) return { x: clamp(x, 0.4, HOUSE_LENGTH - 0.6), z: clamp(z, -HALF_WIDTH + 1, HALF_WIDTH - 1) };
  return { x: clamp(x, -16, -1), z: clamp(z, -9, 9) };
}

/** yaw để camera đứng ở `from` nhìn về `to`. */
export function yawToward(from: Point, to: Point): number {
  return Math.atan2(-(to.x - from.x), -(to.z - from.z));
}
