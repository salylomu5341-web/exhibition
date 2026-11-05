export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Độ lệch góc ngắn nhất (rad) để quay từ `from` tới `to`, trong khoảng (-π, π]. */
export function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
