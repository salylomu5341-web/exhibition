/** Vùng cắt trên ảnh nguồn để phủ kín khung đích mà không méo (giống object-fit: cover). */
export function coverRect(srcW: number, srcH: number, dstW: number, dstH: number): { sx: number; sy: number; sw: number; sh: number } {
  const dstAspect = dstW / dstH;
  if (srcW / srcH > dstAspect) {
    const sw = srcH * dstAspect;
    return { sx: (srcW - sw) / 2, sy: 0, sw, sh: srcH };
  }
  const sh = srcW / dstAspect;
  return { sx: 0, sy: (srcH - sh) / 2, sw: srcW, sh };
}

/** Tâm vòng đặt mặt trên ảnh trang phục, tính theo tỉ lệ khung (vòng cách mép trên 6%, cao 13%). */
export const FACE_X = 0.5;
export const FACE_Y = 0.125;
export const MIN_SCALE = 0.4;
export const MAX_SCALE = 2.5;

/** Vị trí trang phục: tâm vòng mặt ở (x, y) pixel khung đích, phóng to `scale` lần quanh tâm đó. */
export interface Fit {
  x: number;
  y: number;
  scale: number;
}

export function defaultFit(dstW: number, dstH: number): Fit {
  return { x: dstW * FACE_X, y: dstH * FACE_Y, scale: 1 };
}

/** Giữ cỡ trong giới hạn và tâm vòng mặt trong khung, để trang phục không bị kéo mất. */
export function clampFit(fit: Fit, dstW: number, dstH: number): Fit {
  return {
    x: Math.min(dstW, Math.max(0, fit.x)),
    y: Math.min(dstH, Math.max(0, fit.y)),
    scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, fit.scale)),
  };
}

/** Chỗ vẽ ảnh trang phục (cùng tỉ lệ khung đích) theo `fit`. */
export function fitRect(fit: Fit, dstW: number, dstH: number): { dx: number; dy: number; dw: number; dh: number } {
  const dw = dstW * fit.scale;
  const dh = dstH * fit.scale;
  return { dx: fit.x - dw * FACE_X, dy: fit.y - dh * FACE_Y, dw, dh };
}
