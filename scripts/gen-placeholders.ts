/**
 * Tạo file media mẫu (ảnh, âm thanh, GLB) cho mọi đường dẫn /media/... mà nội dung đang dùng.
 *
 * - Mặc định chỉ tạo file CHƯA có; file thật đã đặt vào public/media được giữ nguyên.
 * - `--force` ghi đè TẤT CẢ đường dẫn media trong nội dung, kể cả ảnh/âm thanh thật. Chỉ dùng khi muốn làm lại từ đầu.
 */
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { gongGlb } from './lib/glb';
import { PUBLIC_DIR, resolveInside } from './lib/paths';
import { readBook, readContent } from './lib/read-content';
import { SAMPLE_RATE, gongTone, tone } from './lib/synth';
import { encodeWav } from './lib/wav';

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;
type Draw = (ctx: Ctx, w: number, h: number) => void;

const force = process.argv.includes('--force');
const GONG_FREQS = [174.6, 196, 220, 246.9, 261.6, 293.7];
const FONT = '"Segoe UI", Roboto, Arial, sans-serif';
let written = 0;

async function put(rel: string, make: () => Promise<Buffer> | Buffer): Promise<void> {
  const file = resolveInside(PUBLIC_DIR, rel);
  if (!force) {
    try {
      await access(file);
      return;
    } catch {
      // Chưa có file: tạo mới.
    }
  }
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, await make());
  written++;
  console.log(`  + public${rel}`);
}

function rng(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function canvasOf(w: number, h: number, draw: Draw) {
  const canvas = createCanvas(w, h);
  draw(canvas.getContext('2d'), w, h);
  return canvas;
}
const jpg = (w: number, h: number, draw: Draw) => canvasOf(w, h, draw).encode('jpeg', 82);
const png = (w: number, h: number, draw: Draw) => canvasOf(w, h, draw).encode('png');

// ---------- Vân bề mặt ----------

const drawWoven: Draw = (ctx, w, h) => {
  const cell = 16;
  const r = rng(1);
  for (let y = 0; y < h / cell; y++) {
    for (let x = 0; x < w / cell; x++) {
      const horizontal = (Math.abs((x % 16) - 8) + Math.abs((y % 16) - 8)) % 6 < 3;
      const v = (horizontal ? 200 : 150) + Math.floor(r() * 24) - 12;
      ctx.fillStyle = `rgb(${v}, ${Math.floor(v * 0.78)}, ${Math.floor(v * 0.55)})`;
      ctx.fillRect(x * cell, y * cell, cell, cell);
      ctx.strokeStyle = 'rgba(60, 40, 20, 0.35)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (horizontal) {
        ctx.moveTo(x * cell, y * cell + cell / 2);
        ctx.lineTo(x * cell + cell, y * cell + cell / 2);
      } else {
        ctx.moveTo(x * cell + cell / 2, y * cell);
        ctx.lineTo(x * cell + cell / 2, y * cell + cell);
      }
      ctx.stroke();
    }
  }
};

const drawThatch: Draw = (ctx, w, h) => {
  const r = rng(2);
  ctx.fillStyle = '#8c6f68';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    const x = r() * w;
    const y = r() * h;
    const len = 20 + r() * 40;
    const shade = 90 + Math.floor(r() * 70);
    ctx.strokeStyle = `rgba(${shade + 30}, ${shade}, ${shade - 10}, 0.6)`;
    ctx.lineWidth = 1 + r() * 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (r() - 0.5) * 6, y + len);
    ctx.stroke();
  }
};

const drawWood: Draw = (ctx, w, h) => {
  const r = rng(3);
  ctx.fillStyle = '#7a5230';
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 3) {
    ctx.strokeStyle = `rgba(40, 22, 8, ${0.08 + r() * 0.2})`;
    ctx.beginPath();
    for (let y = 0; y <= h; y += 16) ctx.lineTo(x + Math.sin(y / 40 + x) * 2, y);
    ctx.stroke();
  }
};

const drawFloor: Draw = (ctx, w, h) => {
  const r = rng(4);
  for (let y = 0; y < h; y += 64) {
    const v = 120 + Math.floor(r() * 30);
    ctx.fillStyle = `rgb(${v}, ${Math.floor(v * 0.7)}, ${Math.floor(v * 0.45)})`;
    ctx.fillRect(0, y, w, 64);
    ctx.fillStyle = 'rgba(30, 18, 8, 0.6)';
    ctx.fillRect(0, y, w, 2);
  }
};

const drawStone: Draw = (ctx, w, h) => {
  const r = rng(5);
  ctx.fillStyle = '#2f2f2f';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) {
    const g = 60 + Math.floor(r() * 50);
    ctx.fillStyle = `rgb(${g}, ${g}, ${g + 4})`;
    ctx.fillRect(r() * w, r() * h, 30 + r() * 60, 20 + r() * 40);
  }
};

const drawGround: Draw = (ctx, w, h) => {
  const r = rng(6);
  ctx.fillStyle = '#b9b6ae';
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 3000; i++) {
    const g = 160 + Math.floor(r() * 60);
    ctx.fillStyle = `rgba(${g}, ${g}, ${g - 6}, 0.35)`;
    ctx.fillRect(r() * w, r() * h, 2, 2);
  }
  ctx.strokeStyle = 'rgba(90, 90, 90, 0.5)';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, w - 2, h - 2);
};

// ---------- Ảnh mẫu ----------

function drawPhoto(label: string, hue: number): Draw {
  return (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, `hsl(${hue}, 45%, 62%)`);
    g.addColorStop(1, `hsl(${hue + 30}, 40%, 30%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.75);
    ctx.quadraticCurveTo(w * 0.3, h * 0.5, w * 0.6, h * 0.7);
    ctx.quadraticCurveTo(w * 0.8, h * 0.8, w, h * 0.6);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.font = `bold 56px ${FONT}`;
    ctx.fillText(label, w / 2, h / 2);
    ctx.font = `32px ${FONT}`;
    ctx.fillText('Ảnh mẫu – thay bằng ảnh thật', w / 2, h / 2 + 64);
  };
}

function drawGong(n: number): Draw {
  return (ctx, w, h) => {
    const g = ctx.createRadialGradient(w * 0.45, h * 0.4, 20, w / 2, h / 2, w / 2);
    g.addColorStop(0, '#f2d27a');
    g.addColorStop(1, '#8a6420');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80, 50, 10, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#d9b24c';
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3b2a1a';
    ctx.font = `bold 64px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), w / 2, h * 0.78);
  };
}

function drawCostume(variant: number): Draw {
  return (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    const stripes = (top: number, bottom: number) => {
      for (let y = top; y < bottom; y += 36) {
        ctx.fillStyle = '#1d1d1d';
        ctx.fillRect(0, y, w, 24);
        ctx.fillStyle = variant === 0 ? '#b3261e' : '#c2185b';
        ctx.fillRect(0, y + 24, w, 8);
        ctx.fillStyle = '#e0b43a';
        ctx.fillRect(0, y + 32, w, 4);
      }
    };
    ctx.save();
    ctx.beginPath();
    // Vai và thân áo; phần trên y = 560 để trống cho mặt khách.
    ctx.moveTo(w * 0.08, h);
    ctx.lineTo(w * 0.1, h * 0.58);
    ctx.quadraticCurveTo(w * 0.2, h * 0.47, w * 0.4, h * 0.47);
    ctx.lineTo(w * 0.6, h * 0.47);
    ctx.quadraticCurveTo(w * 0.8, h * 0.47, w * 0.9, h * 0.58);
    ctx.lineTo(w * 0.92, h);
    ctx.closePath();
    ctx.clip();
    stripes(h * 0.46, h);
    ctx.restore();
    // Cổ áo
    ctx.fillStyle = '#e0b43a';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.475, w * 0.11, h * 0.025, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = `bold 36px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.fillText(variant === 0 ? 'Trang phục nam (mẫu)' : 'Trang phục nữ (mẫu)', w / 2, h - 40);
  };
}

function drawCostumeThumb(variant: number): Draw {
  return (ctx, w, h) => {
    ctx.fillStyle = '#f3e6cc';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9a77c';
    ctx.beginPath();
    ctx.ellipse(w / 2, h * 0.32, w * 0.13, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(canvasOf(900, 1200, drawCostume(variant)), 0, 0, w, h);
  };
}

function drawShare(siteName: string, title: string): Draw {
  return (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#5a3d22');
    g.addColorStop(1, '#2a1d10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.save();
    ctx.globalAlpha = 0.35;
    drawWoven(ctx, w, 90);
    ctx.restore();
    ctx.fillStyle = '#f3e6cc';
    ctx.textAlign = 'left';
    ctx.font = `600 40px ${FONT}`;
    ctx.fillText(siteName, 72, 200);
    ctx.font = `bold 72px ${FONT}`;
    ctx.fillText(title, 72, 320);
    ctx.font = `32px ${FONT}`;
    ctx.fillStyle = '#d9b24c';
    ctx.fillText('Không gian nhà dài 3D · Song ngữ Việt – M\'Nông', 72, 420);
  };
}

// ---------- Chạy ----------

async function main(): Promise<void> {
  if (force) {
    console.warn('CẢNH BÁO: --force sẽ ghi đè mọi file media được nội dung tham chiếu, kể cả ảnh/âm thanh thật.');
  }
  const { site, rooms } = await readContent({ checkFiles: false });

  await put('/media/textures/woven.jpg', () => jpg(512, 512, drawWoven));
  await put('/media/textures/thatch.jpg', () => jpg(512, 512, drawThatch));
  await put('/media/textures/wood.jpg', () => jpg(512, 512, drawWood));
  await put('/media/textures/floor.jpg', () => jpg(512, 512, drawFloor));
  await put('/media/textures/stone.jpg', () => jpg(512, 512, drawStone));
  await put('/media/textures/ground.jpg', () => jpg(512, 512, drawGround));

  await put('/media/ui/dung.wav', () => encodeWav(tone([660, 880], 0.16), SAMPLE_RATE));
  await put('/media/ui/sai.wav', () => encodeWav(tone([233, 185], 0.22), SAMPLE_RATE));

  await put(site.seo.image, () => jpg(1200, 630, drawShare(site.name.vi, 'Không gian nhà dài 3D')));

  for (const room of rooms) {
    await put(room.seo.image, () => jpg(1200, 630, drawShare(site.name.vi, room.name.vi)));
    for (const ex of room.exhibits) {
      switch (ex.type) {
        case 'board':
          if (ex.narration?.vi) await put(ex.narration.vi, () => encodeWav(tone([440, 554, 659], 0.4), SAMPLE_RATE));
          if (ex.narration?.mnong) await put(ex.narration.mnong, () => encodeWav(tone([392, 494, 587], 0.4), SAMPLE_RATE));
          break;
        case 'gallery':
          for (const [i, img] of ex.images.entries()) await put(img.src, () => jpg(1024, 768, drawPhoto(img.alt.vi, room.order * 40 + i * 12)));
          break;
        case 'gongs':
          for (const [i, g] of ex.gongs.entries()) {
            await put(g.image, () => png(512, 512, drawGong(i + 1)));
            await put(g.sound, () => encodeWav(gongTone(GONG_FREQS[i]), SAMPLE_RATE));
          }
          break;
        case 'ar':
          await put(ex.glb, () => gongGlb());
          if (ex.poster) await put(ex.poster, () => png(512, 512, drawGong(0)));
          break;
        case 'costume':
          for (const [i, c] of ex.costumes.entries()) {
            await put(c.overlay, () => png(900, 1200, drawCostume(i % 2)));
            await put(c.thumb, () => jpg(300, 400, drawCostumeThumb(i % 2)));
          }
          break;
        case 'video':
        case 'quiz':
          break;
      }
    }
  }

  const book = await readBook({ checkFiles: false });
  await put(book.seo.image, () => jpg(1200, 630, drawShare(site.name.vi, book.title.vi)));

  console.log(`Đã tạo ${written} file mẫu${force ? ' (ghi đè)' : ''}.`);
}

await main();
