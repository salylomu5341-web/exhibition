import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');

/** Ghép đường dẫn web (vd. /media/a.jpg) vào thư mục `base`; ném lỗi nếu kết quả nằm ngoài `base`. */
export function resolveInside(base: string, rel: string): string {
  const root = path.resolve(base);
  const full = path.resolve(root, rel.replace(/^[/\\]+/, ''));
  const back = path.relative(root, full);
  if (back === '' || back === '..' || back.startsWith(`..${path.sep}`) || path.isAbsolute(back)) {
    throw new Error(`đường dẫn "${rel}" nằm ngoài thư mục public`);
  }
  return full;
}
