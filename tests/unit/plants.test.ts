import { describe, expect, it } from 'vitest';
import { ROOM_COUNT } from '../../src/content/schema';
import { exhibitAnchor } from '../../src/scene/layout';
import { plantSpots } from '../../src/scene/plants';

describe('chậu cây trang trí', () => {
  const spots = plantSpots();

  it('có chậu cạnh cột ở mọi ranh giới gian', () => {
    expect(spots).toHaveLength(2 * ROOM_COUNT + 7);
  });

  it('không chắn lối đi giữa', () => {
    for (const [, z] of spots) expect(Math.abs(z)).toBeGreaterThan(1.5);
  });

  it('không đứng trước hiện vật nào', () => {
    for (let order = 1; order <= ROOM_COUNT; order++) {
      for (const wall of ['left', 'right'] as const) {
        for (let slot = 0; slot < 3; slot++) {
          const a = exhibitAnchor(order, wall, slot);
          for (const [x, z] of spots) {
            // Chỉ xét chậu sát cùng vách với hiện vật.
            if (Math.sign(z) !== Math.sign(a.z) || Math.abs(z) < 3.5) continue;
            expect(Math.abs(x - a.x)).toBeGreaterThanOrEqual(1.5);
          }
        }
      }
    }
  });
});
