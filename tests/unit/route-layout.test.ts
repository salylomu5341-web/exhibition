import { describe, expect, it } from 'vitest';
import { exhibitUrl, parseRoute, roomPath } from '../../src/nav/route';
import {
  FACE_FORWARD,
  HOUSE_LENGTH,
  clampToWalkable,
  exhibitAnchor,
  roomIndexAt,
  roomStartX,
  standpoints,
  viewpointFor,
  yawToward,
} from '../../src/scene/layout';

describe('route', () => {
  it('đọc trang chủ', () => {
    expect(parseRoute('/', '')).toEqual({ slug: null, exhibitId: null, lang: null });
  });
  it('đọc gian, hiện vật và ngôn ngữ', () => {
    expect(parseRoute('/phong/cong-chieng/', '?v=bo-chieng&lang=mnong')).toEqual({ slug: 'cong-chieng', exhibitId: 'bo-chieng', lang: 'mnong' });
    expect(parseRoute('/phong/cong-chieng', '')).toEqual({ slug: 'cong-chieng', exhibitId: null, lang: null });
  });
  it('bỏ qua giá trị lạ', () => {
    expect(parseRoute('/phong/cong-chieng/', '?v=<script>&lang=en')).toEqual({ slug: 'cong-chieng', exhibitId: null, lang: null });
    expect(parseRoute('/khac/', '?v=a')).toEqual({ slug: null, exhibitId: null, lang: null });
  });
  it('tạo link gian và link hiện vật', () => {
    expect(roomPath('le-cau-mua')).toBe('/phong/le-cau-mua/');
    expect(exhibitUrl('https://a.com/', 'cong-chieng', 'bo-chieng')).toBe('https://a.com/phong/cong-chieng/?v=bo-chieng');
  });
});

describe('layout', () => {
  it('nhà dài 69m', () => {
    expect(HOUSE_LENGTH).toBe(69);
    expect(roomStartX(1)).toBe(6);
    expect(roomStartX(7)).toBe(60);
  });
  it('roomIndexAt: sân −1, sảnh 0, gian 1–7', () => {
    expect(roomIndexAt(-1)).toBe(-1);
    expect(roomIndexAt(3)).toBe(0);
    expect(roomIndexAt(6)).toBe(1);
    expect(roomIndexAt(14.9)).toBe(1);
    expect(roomIndexAt(15)).toBe(2);
    expect(roomIndexAt(68.9)).toBe(7);
    expect(roomIndexAt(100)).toBe(7);
  });
  it('mỗi gian có 2 điểm đứng, cộng sân và sảnh', () => {
    const sps = standpoints();
    expect(sps).toHaveLength(16);
    expect(sps[0]).toMatchObject({ id: 'san-truoc', roomIndex: -1 });
    expect(sps[1]).toMatchObject({ id: 'sanh', roomIndex: 0 });
    for (let o = 1; o <= 7; o++) expect(sps.filter((s) => s.roomIndex === o)).toHaveLength(2);
  });
  it('vị trí hiện vật trên vách', () => {
    const left = exhibitAnchor(1, 'left', 0);
    expect(left.x).toBe(7.5);
    expect(left.z).toBeCloseTo(-4.88);
    expect(left.facing).toBe(0);
    const right = exhibitAnchor(1, 'right', 2);
    expect(right.x).toBe(13.5);
    expect(right.z).toBeCloseTo(4.88);
    expect(right.facing).toBeCloseTo(Math.PI);
  });
  it('điểm nhìn hiện vật nằm gần lối giữa, cùng phía vách', () => {
    expect(viewpointFor({ x: 7.5, z: -4.88 })).toEqual({ x: 7.5, z: -1.2 });
    expect(viewpointFor({ x: 7.5, z: 4.88 })).toEqual({ x: 7.5, z: 1.2 });
  });
  it('giới hạn chỗ đi trong nhà và ngoài sân', () => {
    const inside = clampToWalkable(100, 9, true);
    expect(inside.x).toBeCloseTo(68.4);
    expect(inside.z).toBe(4);
    expect(clampToWalkable(5, 20, false)).toEqual({ x: -1, z: 9 });
  });
  it('yawToward', () => {
    expect(yawToward({ x: 0, z: 0 }, { x: 0, z: -1 })).toBeCloseTo(0);
    expect(yawToward({ x: 0, z: 0 }, { x: 1, z: 0 })).toBeCloseTo(FACE_FORWARD);
  });
});
