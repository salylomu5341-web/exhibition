import * as THREE from 'three';
import { wrapText } from '../util/text';

export interface LabelOptions {
  width: number;
  height: number;
  bg: string;
  fg: string;
  fontPx: number;
  align?: 'left' | 'center';
  /** Dòng đầu in đậm, to hơn. */
  heading?: boolean;
  /** 'screen': vẽ nút ▶ ở giữa, chữ ở dưới (màn hình video). */
  variant?: 'plain' | 'screen';
}

export interface Label {
  mesh: THREE.Mesh;
  setText(text: string): void;
}

/** Độ phân giải canvas nhãn. fontPx do nơi gọi viết cho 400 px/m, được quy đổi trong drawLabel. */
const PX_PER_METER = 260;
const AUTHORED_PX_PER_METER = 400;
const FONT_FAMILY = '"Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif';

export function makeLabel(text: string, opts: LabelOptions): Label {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(opts.width * PX_PER_METER);
  canvas.height = Math.round(opts.height * PX_PER_METER);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: opts.bg === 'transparent' });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(opts.width, opts.height), material);
  const setText = (value: string) => {
    drawLabel(canvas, value, opts);
    texture.needsUpdate = true;
  };
  setText(text);
  return { mesh, setText };
}

function drawLabel(canvas: HTMLCanvasElement, text: string, o: LabelOptions): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  const fontPx = (o.fontPx * PX_PER_METER) / AUTHORED_PX_PER_METER;
  const pad = Math.round(fontPx * 0.8);
  ctx.clearRect(0, 0, W, H);
  if (o.bg !== 'transparent') {
    ctx.fillStyle = o.bg;
    ctx.fillRect(0, 0, W, H);
  }

  if (o.variant === 'screen') {
    const r = H * 0.16;
    const cy = H * 0.4;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(W / 2, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = o.bg;
    ctx.beginPath();
    ctx.moveTo(W / 2 - r * 0.35, cy - r * 0.5);
    ctx.lineTo(W / 2 - r * 0.35, cy + r * 0.5);
    ctx.lineTo(W / 2 + r * 0.55, cy);
    ctx.closePath();
    ctx.fill();
  }

  const lines: Array<{ text: string; font: string; size: number }> = [];
  text.split('\n').forEach((para, i) => {
    const isHeading = Boolean(o.heading) && i === 0;
    const size = Math.round(isHeading ? fontPx * 1.25 : fontPx);
    const font = `${isHeading ? 700 : 400} ${size}px ${FONT_FAMILY}`;
    if (!para.trim()) {
      lines.push({ text: '', font, size: Math.round(size * 0.5) });
      return;
    }
    ctx.font = font;
    for (const line of wrapText(para, W - pad * 2, (s) => ctx.measureText(s).width)) lines.push({ text: line, font, size });
  });

  const lineHeight = (size: number) => size * 1.3;
  const total = lines.reduce((sum, l) => sum + lineHeight(l.size), 0);
  let y = o.variant === 'screen' ? H * 0.66 : o.align === 'left' ? pad : Math.max(pad * 0.5, (H - total) / 2);
  const x = o.align === 'left' ? pad : W / 2;
  ctx.fillStyle = o.fg;
  ctx.textBaseline = 'top';
  ctx.textAlign = o.align === 'left' ? 'left' : 'center';
  for (const line of lines) {
    if (y + line.size > H - pad * 0.4) break;
    ctx.font = line.font;
    ctx.fillText(line.text, x, y);
    y += lineHeight(line.size);
  }
}
