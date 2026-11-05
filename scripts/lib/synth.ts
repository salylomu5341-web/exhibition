export const SAMPLE_RATE = 22050;

// [tỉ lệ tần số, biên độ, tốc độ tắt] – các họa âm lệch của chiêng.
const GONG_PARTIALS: Array<[number, number, number]> = [
  [1, 1, 1.1],
  [2.02, 0.5, 1.7],
  [2.76, 0.35, 2.3],
  [4.1, 0.2, 3.4],
  [5.4, 0.12, 4.4],
];

export function gongTone(freq: number, seconds = 3.2, sr = SAMPLE_RATE): Float32Array {
  const n = Math.floor(seconds * sr);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / sr;
    const attack = Math.min(1, t / 0.004);
    let s = 0;
    for (const [ratio, amp, decay] of GONG_PARTIALS) s += amp * Math.exp(-decay * t) * Math.sin(2 * Math.PI * freq * ratio * t + ratio);
    out[i] = 0.4 * attack * s;
  }
  return out;
}

/** Chuỗi nốt ngắn, mỗi nốt dài `segment` giây. */
export function tone(freqs: number[], segment: number, sr = SAMPLE_RATE): Float32Array {
  const per = Math.floor(segment * sr);
  const out = new Float32Array(per * freqs.length);
  freqs.forEach((freq, k) => {
    for (let i = 0; i < per; i++) {
      const t = i / sr;
      const env = Math.min(1, t / 0.01) * Math.exp(-4 * t / segment);
      out[k * per + i] = 0.5 * env * (Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t));
    }
  });
  return out;
}
