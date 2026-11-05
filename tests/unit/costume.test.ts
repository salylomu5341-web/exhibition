import { describe, expect, it } from 'vitest';
import { MAX_SCALE, MIN_SCALE, clampFit, coverRect, defaultFit, fitRect } from '../../src/features/costume/geometry';

describe('coverRect', () => {
  it('ảnh ngang: cắt hai bên', () => {
    expect(coverRect(1280, 960, 1080, 1440)).toEqual({ sx: 280, sy: 0, sw: 720, sh: 960 });
  });
  it('ảnh dọc cao hơn khung: cắt trên dưới', () => {
    expect(coverRect(720, 1280, 1080, 1440)).toEqual({ sx: 0, sy: 160, sw: 720, sh: 960 });
  });
});

describe('fitRect', () => {
  it('chưa kéo: trang phục phủ đúng khung', () => {
    expect(fitRect(defaultFit(1080, 1440), 1080, 1440)).toEqual({ dx: 0, dy: 0, dw: 1080, dh: 1440 });
  });
  it('phóng to quanh vòng mặt: tâm vòng mặt đứng yên', () => {
    const r = fitRect({ x: 540, y: 180, scale: 2 }, 1080, 1440);
    expect(r).toEqual({ dx: -540, dy: -180, dw: 2160, dh: 2880 });
    expect(r.dx + r.dw * 0.5).toBe(540);
    expect(r.dy + r.dh * 0.125).toBe(180);
  });
  it('kéo trang phục: dịch nguyên khối', () => {
    expect(fitRect({ x: 640, y: 230, scale: 1 }, 1080, 1440)).toEqual({ dx: 100, dy: 50, dw: 1080, dh: 1440 });
  });
});

describe('clampFit', () => {
  it('giữ cỡ trong giới hạn và vòng mặt trong khung', () => {
    expect(clampFit({ x: -50, y: 2000, scale: 9 }, 1080, 1440)).toEqual({ x: 0, y: 1440, scale: MAX_SCALE });
    expect(clampFit({ x: 300, y: 300, scale: 0.01 }, 1080, 1440).scale).toBe(MIN_SCALE);
  });
});
