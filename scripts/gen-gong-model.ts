/**
 * Dựng mô hình AR chiêng từ ảnh chụp mặt chiêng: mỗi hiện vật `ar` lấy ảnh `poster`
 * (ảnh vuông, mặt chiêng tròn vừa khít) dán lên hai mặt, ghi đè file `glb`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCanvas, loadImage } from '@napi-rs/canvas';
import { photoGongGlb } from './lib/glb';
import { PUBLIC_DIR, resolveInside } from './lib/paths';
import { readContent } from './lib/read-content';

const SIZE = 512;

const { rooms } = await readContent({ checkFiles: true });
let written = 0;
for (const room of rooms) {
  for (const ex of room.exhibits) {
    if (ex.type !== 'ar' || !ex.poster) continue;
    const img = await loadImage(resolveInside(PUBLIC_DIR, ex.poster));
    const canvas = createCanvas(SIZE, SIZE);
    const ctx = canvas.getContext('2d');
    // Góc ngoài mặt tròn không hiện trên mô hình; tô màu đồng cho mép mịn.
    ctx.fillStyle = '#3a2f22';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const glb = photoGongGlb(await canvas.encode('jpeg', 88), 'image/jpeg');
    const file = resolveInside(PUBLIC_DIR, ex.glb);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, glb);
    written++;
    console.log(`${ex.glb} ← ${ex.poster} (${Math.round(glb.length / 1024)} KB)`);
  }
}
if (!written) console.log('Không có hiện vật AR nào có ảnh poster.');
