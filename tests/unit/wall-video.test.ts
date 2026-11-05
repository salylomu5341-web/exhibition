import { describe, expect, it } from 'vitest';
import { exhibitAnchor, viewpointAt, viewpointFor } from '../../src/scene/layout';
import { fitDistance } from '../../src/scene/wall-video';

describe('fitDistance', () => {
  it('màn ngang: đứng gần, không gần hơn 1,3 m', () => {
    expect(fitDistance(70, 1240 / 640, 2, 1.125)).toBe(1.3);
  });

  it('màn dọc điện thoại: lùi xa để màn vừa bề ngang', () => {
    const d = fitDistance(90, 375 / 812, 2, 1.125);
    expect(d).toBeGreaterThan(3);
    expect(d).toBeLessThan(3.2);
  });
});

describe('viewpointAt', () => {
  it('đứng cách vách đúng khoảng yêu cầu, cùng phía với hiện vật', () => {
    const left = exhibitAnchor(1, 'left', 1);
    const right = exhibitAnchor(1, 'right', 1);
    expect(viewpointAt(left, 1.3)).toEqual({ x: left.x, z: left.z + 1.3 });
    expect(viewpointAt(right, 1.3).z).toBeCloseTo(right.z - 1.3);
  });

  it('không lùi xa hơn chỗ đứng thường', () => {
    const anchor = exhibitAnchor(2, 'right', 0);
    const vp = viewpointAt(anchor, 10);
    expect(vp.x).toBe(viewpointFor(anchor).x);
    expect(vp.z).toBeCloseTo(viewpointFor(anchor).z);
  });
});
