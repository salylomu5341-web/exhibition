# Triển lãm 3D văn hóa M'Nông – Kế hoạch code

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Website tĩnh cho khách "đi bộ" trong nhà dài M'Nông 3D qua 7 gian triển lãm, có song ngữ Việt – M'Nông, thuyết minh, ảnh, video YouTube, 6 chiêng bấm phát tiếng, AR, chụp ảnh mặc trang phục, trắc nghiệm, link/QR tới từng hiện vật, SEO đầy đủ và bản 2D dự phòng.

**Architecture:** Vite + TypeScript + Three.js, không framework giao diện. Nội dung nằm trong `public/content/*.json`, kiểm tra bằng zod cả lúc build lẫn lúc chạy. Nhà dài dựng bằng code từ hình khối + ảnh vân bề mặt. Sau `vite build`, một script tạo trang HTML riêng cho từng gian (meta SEO + bản chữ HTML), `sitemap.xml`, `robots.txt`. Bản chữ HTML đó cũng là giao diện dự phòng khi máy không chạy được WebGL.

**Tech Stack:** Vite 6, TypeScript 5.8, Three.js 0.176, zod 3, Vitest 3, Playwright 1.52, `@napi-rs/canvas` (tạo ảnh mẫu), `qrcode`, `<model-viewer>` 4 (nạp từ jsDelivr khi mở khung AR).

**Tài liệu thiết kế:** `docs/superpowers/specs/2026-10-30-trien-lam-3d-mnong-design.md`

**Lưu ý chung**

- Máy phát triển là Windows. Lệnh `npm`, `npx`, `git` chạy được trong cả PowerShell lẫn Git Bash.
- Nếu một phiên bản ghim sẵn trong `package.json` không cài được, dùng bản vá gần nhất cùng số chính/phụ và ghi lại trong commit.
- Mọi commit kết thúc bằng dòng `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` (đã có sẵn trong lệnh mẫu).
- Đường dẫn media trong JSON luôn bắt đầu bằng `/media/`.
- Nhãn `[M'Nông] ...` là chữ giữ chỗ cho bản dịch, Bên A sẽ thay.

## Bản đồ file

```
index.html                         khung trang: <!--SEO--> trong head, <!--TEXT--> trong main
site.config.ts                     SITE_URL, giá trị mẫu, locale
vite.config.ts                     cấu hình Vite + Vitest
playwright.config.ts               cấu hình e2e
public/
  favicon.svg
  content/site.json                tên triển lãm, lời chào, SEO trang chủ, danh sách 7 gian
  content/rooms/0N-<slug>.json     nội dung từng gian
  media/...                        ảnh, âm thanh, mô hình (ảnh mẫu do script tạo)
src/
  main.ts                          khởi động: đọc route, nạp nội dung, chọn chế độ 3D hoặc 2D
  util/math.ts                     clamp, easeInOut, shortestAngle
  util/text.ts                     wrapText, excerpt
  content/schema.ts                schema zod + kiểu dữ liệu
  content/validate.ts              kiểm tra liên-file (thứ tự, slug, id)
  content/media.ts                 gom mọi đường dẫn /media/ trong nội dung
  content/escape.ts                esc() cho HTML
  content/load.ts                  nạp JSON lúc chạy
  content/render-html.ts           bản chữ HTML (SEO + dự phòng 2D)
  content/seo.ts                   thẻ meta, JSON-LD, sitemap, robots
  i18n/lang.ts                     ngôn ngữ hiện tại, t(), lưu lựa chọn
  i18n/ui-strings.ts               chữ giao diện song ngữ
  nav/route.ts                     đọc/tạo link /phong/<slug>/?v=<id>&lang=
  nav/rig.ts                       vị trí, hướng nhìn, di chuyển mượt của camera
  nav/input.ts                     kéo để nhìn, chạm, W A S D
  nav/picker.ts                    raycast → HitData
  scene/layout.ts                  kích thước nhà, gian, điểm đứng, vị trí hiện vật (thuần, có test)
  scene/renderer.ts                WebGLRenderer, scene, camera, hasWebGL()
  scene/textures.ts                vân lặp lại, nạp ảnh theo gian
  scene/house.ts                   sân, sàn, vách, cột, mái, cửa
  scene/label.ts                   chữ vẽ lên canvas làm bảng trong cảnh
  exhibits/build.ts                dựng hiện vật 3D theo type
  exhibits/signs.ts                biển tên gian, biển cửa, lời chào ở sảnh
  exhibits/markers.ts              vòng tròn điểm đứng
  features/types.ts                PanelCtx
  features/sound.ts                SoundPlayer (Web Audio)
  features/board.ts, gallery.ts, video.ts, ar.ts
  features/gongs.ts
  features/quiz/logic.ts, features/quiz/panel.ts
  features/costume/geometry.ts, features/costume/booth.ts
  features/registry.ts             chọn renderer theo type
  ui/dom.ts                        h() tạo phần tử
  ui/styles.css
  ui/panel.ts, topbar.ts, roombar.ts, intro.ts, toast.ts, narration.ts
  app/hooks.ts                     window.__exhibition cho e2e
  app/exhibition.ts                ghép cảnh 3D + điều hướng + giao diện
  app/fallback.ts                  chế độ 2D
scripts/
  lib/paths.ts, lib/read-content.ts, lib/wav.ts, lib/synth.ts, lib/glb.ts
  gen-placeholders.ts              tạo media mẫu còn thiếu
  check-content.ts                 kiểm tra nội dung + file media
  build-pages.ts                   trang SEO từng gian, sitemap, robots
  gen-qr.ts                        mã QR + trang in A4
tests/unit/*.test.ts               Vitest
tests/e2e/*.spec.ts                Playwright
docs/HUONG-DAN-NOI-DUNG.md         hướng dẫn thay nội dung cho Bên A
deploy/nginx.conf.example
```

## Phân bổ theo ngày (Điều 8 hợp đồng)

| Ngày | Task |
|---|---|
| 1 | 0–6: khung dự án, schema, nội dung mẫu, media mẫu |
| 2 | 7–11: bố cục, cảnh 3D, di chuyển, giao diện, hiện vật 3D |
| 3 | 12–15: khung thông tin, chiêng, trắc nghiệm, chụp ảnh, ghép app |
| 4 | 16–18: bản 2D dự phòng, SEO, QR |
| 5 | 19–20: e2e, tài liệu, triển khai, thử máy thật |

---

### Task 0: Khởi tạo git và commit tài liệu thiết kế

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Bổ sung `.gitignore`**

```gitignore
node_modules/
dist/
.superpowers/
qr/
test-results/
playwright-report/
```

- [ ] **Step 2: Khởi tạo kho và commit**

```bash
git init
git add .gitignore docs/superpowers/specs/2026-10-30-trien-lam-3d-mnong-design.md docs/superpowers/plans/2026-10-30-trien-lam-3d-mnong.md
git commit -m "docs: add design spec and implementation plan" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

Expected: commit đầu tiên gồm 3 file.

---

### Task 1: Khung dự án Vite + TypeScript + Vitest

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `site.config.ts`, `public/favicon.svg`, `src/main.ts`, `src/ui/styles.css`, `tests/unit/smoke.test.ts`

- [ ] **Step 1: Tạo `package.json`**

```json
{
  "name": "trien-lam-mnong",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "assets": "tsx scripts/gen-placeholders.ts",
    "check:content": "tsx scripts/check-content.ts",
    "typecheck": "tsc --noEmit",
    "build": "npm run check:content && tsc --noEmit && vite build && tsx scripts/build-pages.ts",
    "build:preview": "npm run check:content && tsc --noEmit && vite build && tsx scripts/build-pages.ts --allow-placeholder-url",
    "preview": "vite preview --port 4173 --strictPort",
    "qr": "tsx scripts/gen-qr.ts",
    "test": "vitest run",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "three": "0.176.0",
    "zod": "3.24.2"
  },
  "devDependencies": {
    "@napi-rs/canvas": "0.1.65",
    "@playwright/test": "1.52.0",
    "@types/node": "22.10.2",
    "@types/qrcode": "1.5.5",
    "@types/three": "0.176.0",
    "qrcode": "1.5.4",
    "tsx": "4.19.4",
    "typescript": "5.8.3",
    "vite": "6.3.5",
    "vitest": "3.1.3"
  }
}
```

- [ ] **Step 2: Cài đặt**

Run: `npm install`
Expected: cài xong, không lỗi `ERESOLVE`.

- [ ] **Step 3: Tạo `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vite/client", "node"]
  },
  "include": ["src", "scripts", "tests", "site.config.ts", "vite.config.ts", "playwright.config.ts"]
}
```

- [ ] **Step 4: Tạo `vite.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: { target: 'es2022', chunkSizeWarningLimit: 900 },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
```

- [ ] **Step 5: Tạo `site.config.ts`**

```ts
// Tên miền thật của website. Đổi trước khi chạy `npm run build`.
export const SITE_URL = 'https://example.com';
export const PLACEHOLDER_SITE_URL = 'https://example.com';
export const SITE_LOCALE = 'vi_VN';
```

- [ ] **Step 6: Tạo `index.html`**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
    <meta name="theme-color" content="#3b2a1a" />
    <!--SEO-->
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <noscript><style>#stage { display: none; }</style></noscript>
  </head>
  <body>
    <div id="stage"></div>
    <div id="ui"></div>
    <main id="text-version"><!--TEXT--></main>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: Tạo `public/favicon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="#c9a24a" stroke="#7d5530" stroke-width="4"/>
  <circle cx="32" cy="32" r="8" fill="#e0b85a" stroke="#7d5530" stroke-width="2"/>
</svg>
```

- [ ] **Step 8: Tạo `src/ui/styles.css` (tạm) và `src/main.ts` (tạm)**

`src/ui/styles.css`:

```css
html, body { margin: 0; height: 100%; background: #f6ecd9; font-family: "Segoe UI", Roboto, Arial, sans-serif; }
```

`src/main.ts`:

```ts
import './ui/styles.css';

document.getElementById('text-version')!.textContent = 'Đang dựng triển lãm…';
```

- [ ] **Step 9: Viết test khói `tests/unit/smoke.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { SITE_URL } from '../../site.config';

describe('khung dự án', () => {
  it('có SITE_URL', () => {
    expect(SITE_URL).toMatch(/^https:\/\//);
  });
});
```

- [ ] **Step 10: Chạy test, typecheck, dev server**

Run: `npm test`
Expected: `1 passed`.

Run: `npm run typecheck`
Expected: không có lỗi.

Run: `npm run dev`, mở `http://localhost:5173`
Expected: trang nền kem với dòng "Đang dựng triển lãm…". Dừng dev server.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json tsconfig.json vite.config.ts index.html site.config.ts public/favicon.svg src tests
git commit -m "chore: scaffold Vite + TypeScript + Vitest project" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Tiện ích thuần: math, text, escape

**Files:**
- Create: `src/util/math.ts`, `src/util/text.ts`, `src/content/escape.ts`
- Test: `tests/unit/util.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { clamp, easeInOut, shortestAngle } from '../../src/util/math';
import { excerpt, wrapText } from '../../src/util/text';
import { esc } from '../../src/content/escape';

describe('math', () => {
  it('clamp giới hạn trong khoảng', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('easeInOut đi từ 0 tới 1, đối xứng ở giữa', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
  it('shortestAngle chọn đường quay ngắn nhất', () => {
    expect(shortestAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(shortestAngle(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
    expect(shortestAngle(-3, 3)).toBeCloseTo(6 - Math.PI * 2);
  });
});

describe('text', () => {
  const measure = (s: string) => s.length;
  it('wrapText ngắt dòng theo độ rộng', () => {
    expect(wrapText('một hai ba bốn năm', 7, measure)).toEqual(['một hai', 'ba bốn', 'năm']);
  });
  it('wrapText giữ nguyên từ dài hơn độ rộng', () => {
    expect(wrapText('xinchaoban a', 4, measure)).toEqual(['xinchaoban', 'a']);
  });
  it('excerpt cắt ở khoảng trắng và thêm dấu …', () => {
    expect(excerpt('Cồng chiêng gắn với đời sống', 15)).toBe('Cồng chiêng gắn…');
    expect(excerpt('ngắn', 15)).toBe('ngắn');
  });
});

describe('esc', () => {
  it('thoát ký tự HTML', () => {
    expect(esc(`<a href="x">M'Nông & co</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;M&#39;Nông &amp; co&lt;/a&gt;');
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/util.test.ts`
Expected: FAIL, không tìm thấy module `src/util/math`.

- [ ] **Step 3: Viết `src/util/math.ts`**

```ts
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const easeInOut = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** Độ lệch góc ngắn nhất (rad) để quay từ `from` tới `to`, trong khoảng (-π, π]. */
export function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d <= -Math.PI) d += Math.PI * 2;
  return d;
}
```

- [ ] **Step 4: Viết `src/util/text.ts`**

```ts
export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (!line || measure(test) <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function excerpt(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const space = cut.lastIndexOf(' ');
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
```

- [ ] **Step 5: Viết `src/content/escape.ts`**

```ts
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
```

- [ ] **Step 6: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/util.test.ts`
Expected: PASS (7 test).

- [ ] **Step 7: Commit**

```bash
git add src/util src/content/escape.ts tests/unit/util.test.ts
git commit -m "feat: add math, text wrapping and HTML escape utilities" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Schema nội dung, kiểm tra liên-file, gom đường dẫn media

**Files:**
- Create: `src/content/schema.ts`, `src/content/validate.ts`, `src/content/media.ts`
- Test: `tests/unit/fixtures.ts`, `tests/unit/schema.test.ts`

- [ ] **Step 1: Viết fixture `tests/unit/fixtures.ts`**

```ts
import type { Room, Site } from '../../src/content/schema';

export const L = (vi: string) => ({ vi, mnong: `[M'Nông] ${vi}` });

export function makeRoom(order = 1, overrides: Partial<Room> = {}): Room {
  return {
    id: `0${order}-gian-${order}`,
    slug: `gian-${order}`,
    order,
    name: L(`Gian ${order}`),
    intro: L('Giới thiệu gian'),
    seo: {
      title: `Gian ${order} của người M'Nông – Triển lãm số văn hóa`,
      description: 'Mô tả ngắn cho công cụ tìm kiếm.',
      image: `/media/share/gian-${order}.jpg`,
    },
    exhibits: [
      {
        id: 'gioi-thieu',
        type: 'board',
        position: { wall: 'left', slot: 0 },
        title: L('Giới thiệu'),
        body: L('Đoạn 1\n\nĐoạn 2'),
      },
    ],
    ...overrides,
  };
}

export function makeSite(): Site {
  return {
    name: L('Triển lãm số văn hóa M\'Nông'),
    welcome: L('Chào mừng'),
    seo: { title: 'Trang chủ', description: 'Mô tả', image: '/media/share/home.jpg' },
    rooms: [1, 2, 3, 4, 5, 6, 7].map((o) => `0${o}-gian-${o}`),
  };
}

export const makeRooms = (): Room[] => [1, 2, 3, 4, 5, 6, 7].map((o) => makeRoom(o));
```

- [ ] **Step 2: Viết test `tests/unit/schema.test.ts` (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { RoomSchema, formatIssues } from '../../src/content/schema';
import { validateContent } from '../../src/content/validate';
import { collectMediaPaths } from '../../src/content/media';
import { L, makeRoom, makeRooms, makeSite } from './fixtures';

const gong = (i: number) => ({ name: L(`Chiêng ${i}`), image: `/media/a/c${i}.png`, sound: `/media/a/c${i}.wav` });

describe('RoomSchema', () => {
  it('chấp nhận gian hợp lệ', () => {
    expect(RoomSchema.safeParse(makeRoom()).success).toBe(true);
  });

  it('báo trùng id hiện vật', () => {
    const room = makeRoom(1);
    room.exhibits.push({ ...room.exhibits[0], position: { wall: 'right', slot: 0 } });
    const r = RoomSchema.safeParse(room);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues('x.json', r.error).join('\n')).toContain('trùng id hiện vật "gioi-thieu"');
  });

  it('báo hai hiện vật cùng vị trí', () => {
    const room = makeRoom(1);
    room.exhibits.push({ ...room.exhibits[0], id: 'khac' });
    const r = RoomSchema.safeParse(room);
    expect(r.success).toBe(false);
    if (!r.success) expect(formatIssues('x.json', r.error).join('\n')).toContain('cùng vị trí left-0');
  });

  it('bộ chiêng phải đúng 6 chiếc', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'bo-chieng', type: 'gongs', position: { wall: 'left', slot: 1 }, title: L('Chiêng'), gongs: [1, 2, 3, 4, 5].map(gong) }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
    room.exhibits = [{ id: 'bo-chieng', type: 'gongs', position: { wall: 'left', slot: 1 }, title: L('Chiêng'), gongs: [1, 2, 3, 4, 5, 6].map(gong) }];
    expect(RoomSchema.safeParse(room).success).toBe(true);
  });

  it('youtubeId phải có 11 ký tự', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'v', type: 'video', position: { wall: 'right', slot: 0 }, title: L('Video'), youtubeId: 'ngan' }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
  });

  it('title SEO tối đa 60 ký tự, ảnh chia sẻ phải là JPG', () => {
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 'x'.repeat(61), description: 'd', image: '/media/s.jpg' } })).success).toBe(false);
    expect(RoomSchema.safeParse(makeRoom(1, { seo: { title: 't', description: 'd', image: '/media/s.webp' } })).success).toBe(false);
  });

  it('đường dẫn media phải bắt đầu bằng /media/', () => {
    const room = makeRoom(1, {
      exhibits: [{ id: 'a', type: 'gallery', position: { wall: 'right', slot: 0 }, title: L('Ảnh'), images: [{ src: 'anh.jpg', alt: L('Ảnh') }] }],
    });
    expect(RoomSchema.safeParse(room).success).toBe(false);
  });
});

describe('validateContent', () => {
  it('không lỗi với nội dung đủ 7 gian', () => {
    expect(validateContent(makeSite(), makeRooms())).toEqual([]);
  });

  it('báo trùng thứ tự và trùng slug', () => {
    const rooms = makeRooms();
    rooms[1] = { ...rooms[1], order: 1, slug: 'gian-1' };
    const errors = validateContent(makeSite(), rooms).join('\n');
    expect(errors).toContain('thứ tự gian');
    expect(errors).toContain('trùng slug "gian-1"');
  });

  it('báo id gian không khớp danh sách trong site.json', () => {
    const rooms = makeRooms();
    rooms[0] = { ...rooms[0], id: 'sai-ten' };
    expect(validateContent(makeSite(), rooms).join('\n')).toContain('"sai-ten"');
  });
});

describe('collectMediaPaths', () => {
  it('gom mọi chuỗi bắt đầu bằng /media/', () => {
    const paths = collectMediaPaths({ a: '/media/x.jpg', b: ['khong', { c: '/media/y.wav' }], d: 3 });
    expect([...paths].sort()).toEqual(['/media/x.jpg', '/media/y.wav']);
  });
});
```

- [ ] **Step 3: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: FAIL, không tìm thấy module `src/content/schema`.

- [ ] **Step 4: Viết `src/content/schema.ts`**

```ts
import { z } from 'zod';

export const LANGS = ['vi', 'mnong'] as const;
export type Lang = (typeof LANGS)[number];
export const ROOM_COUNT = 7;

const id = z.string().regex(/^[a-z0-9-]+$/, 'chỉ dùng chữ thường không dấu, số và dấu gạch ngang');
const mediaPath = z.string().regex(/^\/media\/\S+$/, 'đường dẫn phải bắt đầu bằng /media/');

export const LText = z.object({ vi: z.string().min(1), mnong: z.string().min(1) });
const LAudio = z.object({ vi: mediaPath.optional(), mnong: mediaPath.optional() });
const Position = z.object({ wall: z.enum(['left', 'right']), slot: z.number().int().min(0).max(2) });
const base = { id, position: Position };

const Board = z.object({ ...base, type: z.literal('board'), title: LText, body: LText, narration: LAudio.optional() });
const Gallery = z.object({
  ...base,
  type: z.literal('gallery'),
  title: LText,
  images: z.array(z.object({ src: mediaPath, alt: LText, caption: LText.optional() })).min(1),
});
const Video = z.object({
  ...base,
  type: z.literal('video'),
  title: LText,
  youtubeId: z.string().regex(/^[A-Za-z0-9_-]{11}$/, 'youtubeId phải có đúng 11 ký tự'),
});
const Gongs = z.object({
  ...base,
  type: z.literal('gongs'),
  title: LText,
  gongs: z.array(z.object({ name: LText, image: mediaPath, sound: mediaPath })).length(6, 'bộ chiêng phải có đúng 6 chiếc'),
});
const Ar = z.object({
  ...base,
  type: z.literal('ar'),
  title: LText,
  body: LText,
  glb: mediaPath,
  usdz: mediaPath.optional(),
  poster: mediaPath.optional(),
});
const Costume = z.object({
  ...base,
  type: z.literal('costume'),
  title: LText,
  costumes: z.array(z.object({ name: LText, overlay: mediaPath, thumb: mediaPath })).min(1),
});
const Quiz = z.object({
  ...base,
  type: z.literal('quiz'),
  title: LText,
  questions: z
    .array(
      z.object({
        question: LText,
        options: z.array(LText).length(4, 'mỗi câu có đúng 4 đáp án'),
        answer: z.number().int().min(0).max(3),
        explain: LText,
      }),
    )
    .min(1),
});

export const ExhibitSchema = z.discriminatedUnion('type', [Board, Gallery, Video, Gongs, Ar, Costume, Quiz]);

const Seo = z.object({
  title: z.string().min(1).max(60, 'title SEO tối đa 60 ký tự'),
  description: z.string().min(1).max(159, 'description SEO phải dưới 160 ký tự'),
  image: z.string().regex(/^\/media\/\S+\.jpe?g$/i, 'ảnh chia sẻ phải là file JPG trong /media/'),
});

export const RoomSchema = z
  .object({
    id,
    slug: id,
    order: z.number().int().min(1).max(ROOM_COUNT),
    name: LText,
    intro: LText,
    seo: Seo,
    exhibits: z.array(ExhibitSchema).min(1),
  })
  .superRefine((room, ctx) => {
    const ids = new Set<string>();
    const slots = new Set<string>();
    room.exhibits.forEach((ex, i) => {
      if (ids.has(ex.id)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exhibits', i, 'id'], message: `trùng id hiện vật "${ex.id}"` });
      }
      ids.add(ex.id);
      const slot = `${ex.position.wall}-${ex.position.slot}`;
      if (slots.has(slot)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['exhibits', i, 'position'], message: `hai hiện vật cùng vị trí ${slot}` });
      }
      slots.add(slot);
    });
  });

export const SiteSchema = z.object({
  name: LText,
  welcome: LText,
  seo: Seo,
  rooms: z.array(id).length(ROOM_COUNT, `site.json phải liệt kê đúng ${ROOM_COUNT} gian`),
});

export type LText = z.infer<typeof LText>;
export type Exhibit = z.infer<typeof ExhibitSchema>;
export type ExhibitOf<T extends Exhibit['type']> = Extract<Exhibit, { type: T }>;
export type Room = z.infer<typeof RoomSchema>;
export type Site = z.infer<typeof SiteSchema>;

export function formatIssues(file: string, error: z.ZodError): string[] {
  return error.issues.map((issue) => `${file} › ${issue.path.join('.') || '(gốc)'}: ${issue.message}`);
}
```

- [ ] **Step 5: Viết `src/content/validate.ts`**

```ts
import { ROOM_COUNT, type Room, type Site } from './schema';

/** Kiểm tra những ràng buộc giữa các file mà schema từng file không thấy được. */
export function validateContent(site: Site, rooms: Room[]): string[] {
  const errors: string[] = [];

  for (const room of rooms) {
    if (!site.rooms.includes(room.id)) {
      errors.push(`gian có id "${room.id}" không khớp tên file trong site.json`);
    }
  }

  const orders = rooms.map((r) => r.order).sort((a, b) => a - b);
  const expected = Array.from({ length: ROOM_COUNT }, (_, i) => i + 1);
  if (orders.join(',') !== expected.join(',')) {
    errors.push(`thứ tự gian (order) phải là 1–${ROOM_COUNT}, mỗi số một lần; đang có: ${orders.join(', ')}`);
  }

  const slugs = new Set<string>();
  for (const room of rooms) {
    if (slugs.has(room.slug)) errors.push(`trùng slug "${room.slug}"`);
    slugs.add(room.slug);
  }

  return errors;
}
```

- [ ] **Step 6: Viết `src/content/media.ts`**

```ts
export function collectMediaPaths(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (value.startsWith('/media/')) out.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMediaPaths(item, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMediaPaths(item, out));
  }
  return out;
}
```

- [ ] **Step 7: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/schema.test.ts`
Expected: PASS (11 test).

- [ ] **Step 8: Commit**

```bash
git add src/content tests/unit/fixtures.ts tests/unit/schema.test.ts
git commit -m "feat: add content schema and cross-file validation" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Song ngữ: ngôn ngữ hiện tại và chữ giao diện

**Files:**
- Create: `src/i18n/lang.ts`, `src/i18n/ui-strings.ts`
- Test: `tests/unit/lang.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLang, initLang, onLangChange, pickAudio, setLang, t } from '../../src/i18n/lang';

const storage = (value: string | null) => ({ getItem: () => value });

describe('lang', () => {
  beforeEach(() => {
    initLang(null, storage(null));
  });

  it('mặc định là tiếng Việt', () => {
    expect(getLang()).toBe('vi');
  });

  it('ưu tiên ngôn ngữ trên link, rồi tới lựa chọn đã lưu', () => {
    expect(initLang('mnong', storage('vi'))).toBe('mnong');
    expect(initLang(null, storage('mnong'))).toBe('mnong');
    expect(initLang(null, storage('xyz'))).toBe('vi');
  });

  it('không lỗi khi trình duyệt chặn lưu trữ', () => {
    const broken = { getItem: () => { throw new Error('blocked'); } };
    expect(initLang(null, broken)).toBe('vi');
  });

  it('setLang báo cho người nghe, không báo khi không đổi', () => {
    const fn = vi.fn();
    const off = onLangChange(fn);
    setLang('mnong');
    setLang('mnong');
    off();
    setLang('vi');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('mnong');
  });

  it('t lấy chữ theo ngôn ngữ, rỗng thì dùng tiếng Việt', () => {
    expect(t({ vi: 'Chiêng', mnong: 'Cing' }, 'mnong')).toBe('Cing');
    expect(t({ vi: 'Chiêng', mnong: '' }, 'mnong')).toBe('Chiêng');
  });

  it('pickAudio trả null khi thiếu file', () => {
    expect(pickAudio({ vi: '/media/a.wav' }, 'mnong')).toBeNull();
    expect(pickAudio(undefined, 'vi')).toBeNull();
    expect(pickAudio({ vi: '/media/a.wav' }, 'vi')).toBe('/media/a.wav');
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/lang.test.ts`
Expected: FAIL, không tìm thấy module `src/i18n/lang`.

- [ ] **Step 3: Viết `src/i18n/lang.ts`**

```ts
import type { Lang, LText } from '../content/schema';

type Listener = (lang: Lang) => void;

const STORAGE_KEY = 'mnong-lang';
let current: Lang = 'vi';
const listeners = new Set<Listener>();

export function isLang(value: unknown): value is Lang {
  return value === 'vi' || value === 'mnong';
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function initLang(fromUrl: Lang | null, storage: Pick<Storage, 'getItem'> | null = safeStorage()): Lang {
  let saved: string | null = null;
  try {
    saved = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    saved = null;
  }
  current = fromUrl ?? (isLang(saved) ? saved : 'vi');
  return current;
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    safeStorage()?.setItem(STORAGE_KEY, lang);
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn đổi ngôn ngữ trong phiên này.
  }
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function t(text: LText, lang: Lang = current): string {
  return text[lang] || text.vi;
}

export function pickAudio(audio: { vi?: string; mnong?: string } | undefined, lang: Lang = current): string | null {
  return audio?.[lang] ?? null;
}
```

- [ ] **Step 4: Viết `src/i18n/ui-strings.ts`**

```ts
import type { LText } from '../content/schema';

// Bản M'Nông là chữ giữ chỗ, chờ Bên A dịch.
const both = (vi: string): LText => ({ vi, mnong: `[M'Nông] ${vi}` });

export const UI = {
  language: both('Ngôn ngữ'),
  enter: both('Vào nhà dài'),
  prevRoom: both('Gian trước'),
  nextRoom: both('Gian sau'),
  roomList: both('Các gian triển lãm'),
  courtyard: both('Sân trước'),
  hall: both('Sảnh'),
  close: both('Đóng'),
  listen: both('Nghe thuyết minh'),
  stop: both('Dừng thuyết minh'),
  audioError: both('Không tải được âm thanh'),
  mediaError: both('Không tải được'),
  viewerError: both('Không tải được trình xem 3D. Vui lòng kiểm tra mạng.'),
  viewAr: both('Xem AR'),
  arUnsupported: both('Máy này chưa hỗ trợ AR, bạn vẫn xoay xem được mô hình.'),
  hint: both('Chạm vòng tròn trên sàn để đi, kéo để nhìn quanh, chạm hiện vật để xem.'),
  hintDesktop: both('Bấm vòng tròn trên sàn hoặc dùng phím W A S D để đi, kéo chuột để nhìn quanh, bấm hiện vật để xem.'),
  open: both('Xem / nghe'),
  tapToView: both('Chạm để xem'),
  tapToStart: both('Chạm để bắt đầu'),
  tapGong: both('Chạm vào chiêng để nghe'),
  photoCorner: both('Góc chụp ảnh'),
  quizQuestion: both('Câu'),
  quizNext: both('Câu tiếp'),
  quizRetry: both('Chơi lại'),
  quizScore: both('Bạn trả lời đúng {score}/{total} câu'),
  quizCorrect: both('Đúng rồi!'),
  quizWrong: both('Chưa đúng.'),
  quizCount: both('Gồm {n} câu hỏi trắc nghiệm.'),
  boothCamera: both('Bật camera'),
  boothSwitch: both('Đổi camera'),
  boothShoot: both('Chụp ảnh'),
  boothUpload: both('Chọn ảnh có sẵn'),
  boothRetake: both('Chụp lại'),
  boothDownload: both('Tải ảnh về'),
  boothShare: both('Chia sẻ'),
  boothZoom: both('Phóng to'),
  boothNoCamera: both('Không mở được camera. Bạn có thể chọn ảnh có sẵn trong máy.'),
  boothFrame: both("Triển lãm số văn hóa M'Nông"),
  boothPrivacy: both('Ảnh chỉ nằm trên máy của bạn, không gửi đi đâu.'),
  loadError: both('Không tải được nội dung triển lãm. Vui lòng thử lại sau.'),
} satisfies Record<string, LText>;
```

- [ ] **Step 5: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/lang.test.ts`
Expected: PASS (6 test).

- [ ] **Step 6: Commit**

```bash
git add src/i18n tests/unit/lang.test.ts
git commit -m "feat: add bilingual state and UI strings" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Nội dung mẫu 7 gian, đọc nội dung ở Node và trên trình duyệt

**Files:**
- Create: `public/content/site.json`, `public/content/rooms/01-cong-chieng.json` … `07-trac-nghiem.json`
- Create: `scripts/lib/paths.ts`, `scripts/lib/read-content.ts`, `src/content/load.ts`
- Test: `tests/unit/content-files.test.ts`

Video mẫu dùng `aqz-KE-bpKQ` (phim hoạt hình mở "Big Buck Bunny" của Blender). Thay bằng video thật của Bên A sau.

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { readContent } from '../../scripts/lib/read-content';

describe('nội dung trong public/content', () => {
  it('đọc được, hợp lệ, đủ 7 gian theo thứ tự', async () => {
    const { site, rooms } = await readContent({ checkFiles: false });
    expect(site.rooms).toHaveLength(7);
    expect(rooms.map((r) => r.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('gian 1 có bộ 6 chiêng, gian 6 có góc chụp ảnh, gian 7 có trắc nghiệm', async () => {
    const { rooms } = await readContent({ checkFiles: false });
    expect(rooms[0].exhibits.some((e) => e.type === 'gongs')).toBe(true);
    expect(rooms[5].exhibits.some((e) => e.type === 'costume')).toBe(true);
    expect(rooms[6].exhibits.some((e) => e.type === 'quiz')).toBe(true);
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/content-files.test.ts`
Expected: FAIL, không tìm thấy module `scripts/lib/read-content`.

- [ ] **Step 3: Viết `scripts/lib/paths.ts`**

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT_DIR = fileURLToPath(new URL('../../', import.meta.url));
export const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
export const DIST_DIR = path.join(ROOT_DIR, 'dist');
```

- [ ] **Step 4: Viết `scripts/lib/read-content.ts`**

```ts
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { collectMediaPaths } from '../../src/content/media';
import { RoomSchema, SiteSchema, formatIssues, type Room, type Site } from '../../src/content/schema';
import { validateContent } from '../../src/content/validate';
import { PUBLIC_DIR } from './paths';

export interface Content {
  site: Site;
  rooms: Room[];
}

export class ContentError extends Error {
  constructor(readonly issues: string[]) {
    super(`Nội dung có ${issues.length} lỗi:\n${issues.map((i) => `  - ${i}`).join('\n')}`);
  }
}

async function readJson(rel: string, errors: string[]): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path.join(PUBLIC_DIR, rel), 'utf8'));
  } catch (err) {
    errors.push(`public/${rel}: không đọc được (${(err as Error).message})`);
    return undefined;
  }
}

export async function readContent(opts: { checkFiles: boolean }): Promise<Content> {
  const errors: string[] = [];
  const siteRaw = await readJson('content/site.json', errors);
  if (siteRaw === undefined) throw new ContentError(errors);
  const siteParsed = SiteSchema.safeParse(siteRaw);
  if (!siteParsed.success) throw new ContentError(formatIssues('content/site.json', siteParsed.error));
  const site = siteParsed.data;

  const rooms: Room[] = [];
  for (const id of site.rooms) {
    const file = `content/rooms/${id}.json`;
    const raw = await readJson(file, errors);
    if (raw === undefined) continue;
    const parsed = RoomSchema.safeParse(raw);
    if (parsed.success) rooms.push(parsed.data);
    else errors.push(...formatIssues(file, parsed.error));
  }

  if (errors.length === 0) errors.push(...validateContent(site, rooms));

  if (opts.checkFiles && errors.length === 0) {
    for (const media of collectMediaPaths({ site, rooms })) {
      try {
        await access(path.join(PUBLIC_DIR, media));
      } catch {
        errors.push(`thiếu file public${media}`);
      }
    }
  }

  if (errors.length > 0) throw new ContentError(errors);
  rooms.sort((a, b) => a.order - b.order);
  return { site, rooms };
}
```

- [ ] **Step 5: Viết `src/content/load.ts` (nạp trên trình duyệt)**

```ts
import { RoomSchema, SiteSchema, type Room, type Site } from './schema';

async function getJson(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return res.json();
}

export async function loadContent(): Promise<{ site: Site; rooms: Room[] }> {
  const site = SiteSchema.parse(await getJson('/content/site.json'));
  const rooms = await Promise.all(
    site.rooms.map(async (id) => RoomSchema.parse(await getJson(`/content/rooms/${id}.json`))),
  );
  return { site, rooms: rooms.sort((a, b) => a.order - b.order) };
}
```

- [ ] **Step 6: Tạo `public/content/site.json`**

```json
{
  "name": { "vi": "Triển lãm số văn hóa M'Nông", "mnong": "[M'Nông] Triển lãm số văn hóa M'Nông" },
  "welcome": {
    "vi": "[Nội dung mẫu] Chào mừng bạn đến với nhà dài của người M'Nông. Hãy đi dọc lối giữa để khám phá 7 gian về cồng chiêng, lễ hội, âm nhạc, trang phục và thử sức với câu hỏi trắc nghiệm.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Triển lãm số văn hóa M'Nông – Không gian nhà dài 3D",
    "description": "Tham quan nhà dài M'Nông 3D: cồng chiêng, lễ cầu mùa, cúng bến nước, lễ báo hiếu, múa xoang, trang phục và câu hỏi trắc nghiệm.",
    "image": "/media/share/trang-chu.jpg"
  },
  "rooms": [
    "01-cong-chieng",
    "02-le-cau-mua",
    "03-le-cung-ben-nuoc",
    "04-le-bao-hieu",
    "05-hat-mua-xoang-nhac-cu",
    "06-trang-phuc",
    "07-trac-nghiem"
  ]
}
```

- [ ] **Step 7: Tạo `public/content/rooms/01-cong-chieng.json`**

```json
{
  "id": "01-cong-chieng",
  "slug": "cong-chieng",
  "order": 1,
  "name": { "vi": "Văn hóa cồng chiêng", "mnong": "[M'Nông] Văn hóa cồng chiêng" },
  "intro": {
    "vi": "[Nội dung mẫu] Cồng chiêng gắn với mọi nghi lễ quan trọng trong đời sống người M'Nông. Gian này giới thiệu bộ chiêng, cách đánh chiêng và âm thanh của từng chiếc.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Cồng chiêng của người M'Nông – Triển lãm số văn hóa",
    "description": "Gian cồng chiêng trong nhà dài 3D: bấm nghe tiếng 6 loại chiêng, xem ảnh, video và đọc giới thiệu song ngữ Việt – M'Nông.",
    "image": "/media/share/cong-chieng.jpg"
  },
  "exhibits": [
    {
      "id": "gioi-thieu",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Giới thiệu cồng chiêng", "mnong": "[M'Nông] Giới thiệu cồng chiêng" },
      "body": {
        "vi": "[Nội dung mẫu] Cồng chiêng là nhạc cụ thiêng, có mặt trong các lễ hội của cộng đồng M'Nông.\n\n[Nội dung mẫu] Bên A sẽ cung cấp phần giới thiệu chính thức về nguồn gốc, cách bảo quản và vai trò của cồng chiêng.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      },
      "narration": { "vi": "/media/cong-chieng/thuyet-minh-vi.wav", "mnong": "/media/cong-chieng/thuyet-minh-mnong.wav" }
    },
    {
      "id": "bo-chieng",
      "type": "gongs",
      "position": { "wall": "left", "slot": 1 },
      "title": { "vi": "Sáu loại chiêng", "mnong": "[M'Nông] Sáu loại chiêng" },
      "gongs": [
        { "name": { "vi": "Chiêng 1 (tên mẫu)", "mnong": "[M'Nông] Chiêng 1" }, "image": "/media/cong-chieng/chieng-1.png", "sound": "/media/cong-chieng/chieng-1.wav" },
        { "name": { "vi": "Chiêng 2 (tên mẫu)", "mnong": "[M'Nông] Chiêng 2" }, "image": "/media/cong-chieng/chieng-2.png", "sound": "/media/cong-chieng/chieng-2.wav" },
        { "name": { "vi": "Chiêng 3 (tên mẫu)", "mnong": "[M'Nông] Chiêng 3" }, "image": "/media/cong-chieng/chieng-3.png", "sound": "/media/cong-chieng/chieng-3.wav" },
        { "name": { "vi": "Chiêng 4 (tên mẫu)", "mnong": "[M'Nông] Chiêng 4" }, "image": "/media/cong-chieng/chieng-4.png", "sound": "/media/cong-chieng/chieng-4.wav" },
        { "name": { "vi": "Chiêng 5 (tên mẫu)", "mnong": "[M'Nông] Chiêng 5" }, "image": "/media/cong-chieng/chieng-5.png", "sound": "/media/cong-chieng/chieng-5.wav" },
        { "name": { "vi": "Chiêng 6 (tên mẫu)", "mnong": "[M'Nông] Chiêng 6" }, "image": "/media/cong-chieng/chieng-6.png", "sound": "/media/cong-chieng/chieng-6.wav" }
      ]
    },
    {
      "id": "chieng-mau",
      "type": "ar",
      "position": { "wall": "left", "slot": 2 },
      "title": { "vi": "Chiêng mẫu 3D", "mnong": "[M'Nông] Chiêng mẫu 3D" },
      "body": {
        "vi": "[Nội dung mẫu] Xoay để xem chiếc chiêng từ mọi phía. Trên điện thoại hỗ trợ AR, bấm \"Xem AR\" để đặt chiêng vào không gian thật quanh bạn.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      },
      "glb": "/media/cong-chieng/chieng-mau.glb",
      "poster": "/media/cong-chieng/chieng-1.png"
    },
    {
      "id": "anh-cong-chieng",
      "type": "gallery",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Ảnh cồng chiêng", "mnong": "[M'Nông] Ảnh cồng chiêng" },
      "images": [
        { "src": "/media/cong-chieng/anh-1.jpg", "alt": { "vi": "Ảnh mẫu cồng chiêng 1", "mnong": "[M'Nông] Ảnh mẫu cồng chiêng 1" } },
        { "src": "/media/cong-chieng/anh-2.jpg", "alt": { "vi": "Ảnh mẫu cồng chiêng 2", "mnong": "[M'Nông] Ảnh mẫu cồng chiêng 2" } },
        { "src": "/media/cong-chieng/anh-3.jpg", "alt": { "vi": "Ảnh mẫu cồng chiêng 3", "mnong": "[M'Nông] Ảnh mẫu cồng chiêng 3" } },
        { "src": "/media/cong-chieng/anh-4.jpg", "alt": { "vi": "Ảnh mẫu cồng chiêng 4", "mnong": "[M'Nông] Ảnh mẫu cồng chiêng 4" } }
      ]
    },
    {
      "id": "video-cong-chieng",
      "type": "video",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Video cồng chiêng (video mẫu)", "mnong": "[M'Nông] Video cồng chiêng" },
      "youtubeId": "aqz-KE-bpKQ"
    }
  ]
}
```

- [ ] **Step 8: Tạo `public/content/rooms/02-le-cau-mua.json`**

```json
{
  "id": "02-le-cau-mua",
  "slug": "le-cau-mua",
  "order": 2,
  "name": { "vi": "Lễ cầu mùa", "mnong": "[M'Nông] Lễ cầu mùa" },
  "intro": {
    "vi": "[Nội dung mẫu] Lễ cầu mùa là dịp cộng đồng cầu mong mưa thuận gió hòa, lúa rẫy tốt tươi.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Lễ cầu mùa của người M'Nông – Triển lãm số văn hóa",
    "description": "Tìm hiểu lễ cầu mùa của người M'Nông qua ảnh, video và lời giới thiệu song ngữ Việt – M'Nông trong không gian nhà dài 3D.",
    "image": "/media/share/le-cau-mua.jpg"
  },
  "exhibits": [
    {
      "id": "gioi-thieu",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Giới thiệu lễ cầu mùa", "mnong": "[M'Nông] Giới thiệu lễ cầu mùa" },
      "body": {
        "vi": "[Nội dung mẫu] Đoạn giới thiệu ý nghĩa của lễ cầu mùa.\n\n[Nội dung mẫu] Đoạn mô tả trình tự nghi lễ. Bên A sẽ cung cấp nội dung chính thức.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      }
    },
    {
      "id": "anh-le-cau-mua",
      "type": "gallery",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Ảnh lễ cầu mùa", "mnong": "[M'Nông] Ảnh lễ cầu mùa" },
      "images": [
        { "src": "/media/le-cau-mua/anh-1.jpg", "alt": { "vi": "Ảnh mẫu lễ cầu mùa 1", "mnong": "[M'Nông] Ảnh mẫu lễ cầu mùa 1" } },
        { "src": "/media/le-cau-mua/anh-2.jpg", "alt": { "vi": "Ảnh mẫu lễ cầu mùa 2", "mnong": "[M'Nông] Ảnh mẫu lễ cầu mùa 2" } },
        { "src": "/media/le-cau-mua/anh-3.jpg", "alt": { "vi": "Ảnh mẫu lễ cầu mùa 3", "mnong": "[M'Nông] Ảnh mẫu lễ cầu mùa 3" } },
        { "src": "/media/le-cau-mua/anh-4.jpg", "alt": { "vi": "Ảnh mẫu lễ cầu mùa 4", "mnong": "[M'Nông] Ảnh mẫu lễ cầu mùa 4" } }
      ]
    },
    {
      "id": "video-le-cau-mua",
      "type": "video",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Video lễ cầu mùa (video mẫu)", "mnong": "[M'Nông] Video lễ cầu mùa" },
      "youtubeId": "aqz-KE-bpKQ"
    }
  ]
}
```

- [ ] **Step 9: Tạo `public/content/rooms/03-le-cung-ben-nuoc.json`**

```json
{
  "id": "03-le-cung-ben-nuoc",
  "slug": "le-cung-ben-nuoc",
  "order": 3,
  "name": { "vi": "Lễ cúng bến nước", "mnong": "[M'Nông] Lễ cúng bến nước" },
  "intro": {
    "vi": "[Nội dung mẫu] Lễ cúng bến nước thể hiện lòng biết ơn nguồn nước nuôi sống buôn làng.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Lễ cúng bến nước của người M'Nông – Triển lãm số văn hóa",
    "description": "Lễ cúng bến nước của người M'Nông: ảnh, video và thuyết minh song ngữ Việt – M'Nông trong không gian nhà dài 3D.",
    "image": "/media/share/le-cung-ben-nuoc.jpg"
  },
  "exhibits": [
    {
      "id": "gioi-thieu",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Giới thiệu lễ cúng bến nước", "mnong": "[M'Nông] Giới thiệu lễ cúng bến nước" },
      "body": {
        "vi": "[Nội dung mẫu] Đoạn giới thiệu ý nghĩa của lễ cúng bến nước.\n\n[Nội dung mẫu] Đoạn mô tả lễ vật và trình tự nghi lễ. Bên A sẽ cung cấp nội dung chính thức.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      }
    },
    {
      "id": "anh-le-cung-ben-nuoc",
      "type": "gallery",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Ảnh lễ cúng bến nước", "mnong": "[M'Nông] Ảnh lễ cúng bến nước" },
      "images": [
        { "src": "/media/le-cung-ben-nuoc/anh-1.jpg", "alt": { "vi": "Ảnh mẫu lễ cúng bến nước 1", "mnong": "[M'Nông] Ảnh mẫu lễ cúng bến nước 1" } },
        { "src": "/media/le-cung-ben-nuoc/anh-2.jpg", "alt": { "vi": "Ảnh mẫu lễ cúng bến nước 2", "mnong": "[M'Nông] Ảnh mẫu lễ cúng bến nước 2" } },
        { "src": "/media/le-cung-ben-nuoc/anh-3.jpg", "alt": { "vi": "Ảnh mẫu lễ cúng bến nước 3", "mnong": "[M'Nông] Ảnh mẫu lễ cúng bến nước 3" } },
        { "src": "/media/le-cung-ben-nuoc/anh-4.jpg", "alt": { "vi": "Ảnh mẫu lễ cúng bến nước 4", "mnong": "[M'Nông] Ảnh mẫu lễ cúng bến nước 4" } }
      ]
    },
    {
      "id": "video-le-cung-ben-nuoc",
      "type": "video",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Video lễ cúng bến nước (video mẫu)", "mnong": "[M'Nông] Video lễ cúng bến nước" },
      "youtubeId": "aqz-KE-bpKQ"
    }
  ]
}
```

- [ ] **Step 10: Tạo `public/content/rooms/04-le-bao-hieu.json`**

```json
{
  "id": "04-le-bao-hieu",
  "slug": "le-bao-hieu",
  "order": 4,
  "name": { "vi": "Lễ báo hiếu", "mnong": "[M'Nông] Lễ báo hiếu" },
  "intro": {
    "vi": "[Nội dung mẫu] Lễ báo hiếu là dịp con cháu tỏ lòng biết ơn cha mẹ, ông bà.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Lễ báo hiếu của người M'Nông – Triển lãm số văn hóa",
    "description": "Lễ báo hiếu của người M'Nông: ảnh, video và lời giới thiệu song ngữ Việt – M'Nông trong không gian nhà dài 3D.",
    "image": "/media/share/le-bao-hieu.jpg"
  },
  "exhibits": [
    {
      "id": "gioi-thieu",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Giới thiệu lễ báo hiếu", "mnong": "[M'Nông] Giới thiệu lễ báo hiếu" },
      "body": {
        "vi": "[Nội dung mẫu] Đoạn giới thiệu ý nghĩa của lễ báo hiếu.\n\n[Nội dung mẫu] Đoạn mô tả các phần của buổi lễ. Bên A sẽ cung cấp nội dung chính thức.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      }
    },
    {
      "id": "anh-le-bao-hieu",
      "type": "gallery",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Ảnh lễ báo hiếu", "mnong": "[M'Nông] Ảnh lễ báo hiếu" },
      "images": [
        { "src": "/media/le-bao-hieu/anh-1.jpg", "alt": { "vi": "Ảnh mẫu lễ báo hiếu 1", "mnong": "[M'Nông] Ảnh mẫu lễ báo hiếu 1" } },
        { "src": "/media/le-bao-hieu/anh-2.jpg", "alt": { "vi": "Ảnh mẫu lễ báo hiếu 2", "mnong": "[M'Nông] Ảnh mẫu lễ báo hiếu 2" } },
        { "src": "/media/le-bao-hieu/anh-3.jpg", "alt": { "vi": "Ảnh mẫu lễ báo hiếu 3", "mnong": "[M'Nông] Ảnh mẫu lễ báo hiếu 3" } },
        { "src": "/media/le-bao-hieu/anh-4.jpg", "alt": { "vi": "Ảnh mẫu lễ báo hiếu 4", "mnong": "[M'Nông] Ảnh mẫu lễ báo hiếu 4" } }
      ]
    },
    {
      "id": "video-le-bao-hieu",
      "type": "video",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Video lễ báo hiếu (video mẫu)", "mnong": "[M'Nông] Video lễ báo hiếu" },
      "youtubeId": "aqz-KE-bpKQ"
    }
  ]
}
```

- [ ] **Step 11: Tạo `public/content/rooms/05-hat-mua-xoang-nhac-cu.json`**

```json
{
  "id": "05-hat-mua-xoang-nhac-cu",
  "slug": "hat-mua-xoang-nhac-cu",
  "order": 5,
  "name": { "vi": "Bài hát, múa xoang, nhạc cụ", "mnong": "[M'Nông] Bài hát, múa xoang, nhạc cụ" },
  "intro": {
    "vi": "[Nội dung mẫu] Gian này chia ba khu: bài hát dân tộc, múa xoang và nhạc cụ dân gian.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Bài hát, múa xoang, nhạc cụ M'Nông – Triển lãm số 3D",
    "description": "Bài hát dân tộc, múa xoang và nhạc cụ dân gian M'Nông: giới thiệu song ngữ kèm video trong không gian nhà dài 3D.",
    "image": "/media/share/hat-mua-xoang-nhac-cu.jpg"
  },
  "exhibits": [
    {
      "id": "hat-dan-toc",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Bài hát dân tộc", "mnong": "[M'Nông] Bài hát dân tộc" },
      "body": { "vi": "[Nội dung mẫu] Giới thiệu các làn điệu dân ca M'Nông.", "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp." }
    },
    {
      "id": "mua-xoang",
      "type": "board",
      "position": { "wall": "left", "slot": 1 },
      "title": { "vi": "Múa xoang", "mnong": "[M'Nông] Múa xoang" },
      "body": { "vi": "[Nội dung mẫu] Giới thiệu điệu múa xoang trong lễ hội.", "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp." }
    },
    {
      "id": "nhac-cu",
      "type": "board",
      "position": { "wall": "left", "slot": 2 },
      "title": { "vi": "Nhạc cụ dân gian", "mnong": "[M'Nông] Nhạc cụ dân gian" },
      "body": { "vi": "[Nội dung mẫu] Giới thiệu các nhạc cụ dân gian của người M'Nông.", "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp." }
    },
    {
      "id": "video-hat-dan-toc",
      "type": "video",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Video bài hát dân tộc (video mẫu)", "mnong": "[M'Nông] Video bài hát dân tộc" },
      "youtubeId": "aqz-KE-bpKQ"
    },
    {
      "id": "video-mua-xoang",
      "type": "video",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Video múa xoang (video mẫu)", "mnong": "[M'Nông] Video múa xoang" },
      "youtubeId": "aqz-KE-bpKQ"
    },
    {
      "id": "video-nhac-cu",
      "type": "video",
      "position": { "wall": "right", "slot": 2 },
      "title": { "vi": "Video nhạc cụ dân gian (video mẫu)", "mnong": "[M'Nông] Video nhạc cụ dân gian" },
      "youtubeId": "aqz-KE-bpKQ"
    }
  ]
}
```

- [ ] **Step 12: Tạo `public/content/rooms/06-trang-phuc.json`**

```json
{
  "id": "06-trang-phuc",
  "slug": "trang-phuc",
  "order": 6,
  "name": { "vi": "Trang phục", "mnong": "[M'Nông] Trang phục" },
  "intro": {
    "vi": "[Nội dung mẫu] Trang phục truyền thống M'Nông với hoa văn dệt thủ công. Hãy ghé góc chụp ảnh để mặc thử.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Trang phục của người M'Nông – Triển lãm số văn hóa",
    "description": "Trang phục truyền thống M'Nông: ảnh, video, giới thiệu song ngữ và góc mặc thử trang phục để chụp ảnh lưu niệm.",
    "image": "/media/share/trang-phuc.jpg"
  },
  "exhibits": [
    {
      "id": "gioi-thieu",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Giới thiệu trang phục", "mnong": "[M'Nông] Giới thiệu trang phục" },
      "body": {
        "vi": "[Nội dung mẫu] Đoạn giới thiệu trang phục nam, nữ và ý nghĩa hoa văn.\n\n[Nội dung mẫu] Bên A sẽ cung cấp nội dung chính thức.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      }
    },
    {
      "id": "goc-chup-anh",
      "type": "costume",
      "position": { "wall": "left", "slot": 1 },
      "title": { "vi": "Mặc thử trang phục", "mnong": "[M'Nông] Mặc thử trang phục" },
      "costumes": [
        { "name": { "vi": "Trang phục nam (mẫu)", "mnong": "[M'Nông] Trang phục nam" }, "overlay": "/media/trang-phuc/nam.png", "thumb": "/media/trang-phuc/nam-nho.jpg" },
        { "name": { "vi": "Trang phục nữ (mẫu)", "mnong": "[M'Nông] Trang phục nữ" }, "overlay": "/media/trang-phuc/nu.png", "thumb": "/media/trang-phuc/nu-nho.jpg" }
      ]
    },
    {
      "id": "video-trang-phuc",
      "type": "video",
      "position": { "wall": "right", "slot": 0 },
      "title": { "vi": "Video trang phục (video mẫu)", "mnong": "[M'Nông] Video trang phục" },
      "youtubeId": "aqz-KE-bpKQ"
    },
    {
      "id": "anh-trang-phuc",
      "type": "gallery",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Ảnh trang phục", "mnong": "[M'Nông] Ảnh trang phục" },
      "images": [
        { "src": "/media/trang-phuc/anh-1.jpg", "alt": { "vi": "Ảnh mẫu trang phục 1", "mnong": "[M'Nông] Ảnh mẫu trang phục 1" } },
        { "src": "/media/trang-phuc/anh-2.jpg", "alt": { "vi": "Ảnh mẫu trang phục 2", "mnong": "[M'Nông] Ảnh mẫu trang phục 2" } },
        { "src": "/media/trang-phuc/anh-3.jpg", "alt": { "vi": "Ảnh mẫu trang phục 3", "mnong": "[M'Nông] Ảnh mẫu trang phục 3" } }
      ]
    }
  ]
}
```

- [ ] **Step 13: Tạo `public/content/rooms/07-trac-nghiem.json`**

Câu hỏi là câu mẫu; Bên A phải kiểm tra lại nội dung.

```json
{
  "id": "07-trac-nghiem",
  "slug": "trac-nghiem",
  "order": 7,
  "name": { "vi": "Câu hỏi trắc nghiệm", "mnong": "[M'Nông] Câu hỏi trắc nghiệm" },
  "intro": {
    "vi": "[Nội dung mẫu] Sau khi tham quan, hãy thử trả lời vài câu hỏi về văn hóa M'Nông.",
    "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
  },
  "seo": {
    "title": "Câu hỏi trắc nghiệm về văn hóa M'Nông – Triển lãm số",
    "description": "Thử sức với câu hỏi trắc nghiệm về văn hóa M'Nông, có âm thanh báo đúng sai và tổng điểm ngay sau khi trả lời.",
    "image": "/media/share/trac-nghiem.jpg"
  },
  "exhibits": [
    {
      "id": "huong-dan",
      "type": "board",
      "position": { "wall": "left", "slot": 0 },
      "title": { "vi": "Cách chơi", "mnong": "[M'Nông] Cách chơi" },
      "body": {
        "vi": "Chạm vào bảng câu hỏi ở vách đối diện. Mỗi câu có 4 đáp án, chọn một đáp án để biết đúng hay sai. Cuối bài bạn sẽ thấy tổng điểm.",
        "mnong": "[M'Nông] Bản dịch đang chờ Bên A cung cấp."
      }
    },
    {
      "id": "cau-hoi",
      "type": "quiz",
      "position": { "wall": "right", "slot": 1 },
      "title": { "vi": "Câu hỏi trắc nghiệm (mẫu)", "mnong": "[M'Nông] Câu hỏi trắc nghiệm" },
      "questions": [
        {
          "question": { "vi": "Không gian văn hóa Cồng chiêng Tây Nguyên được UNESCO công nhận năm nào?", "mnong": "[M'Nông] Câu hỏi 1" },
          "options": [
            { "vi": "1995", "mnong": "1995" },
            { "vi": "2005", "mnong": "2005" },
            { "vi": "2015", "mnong": "2015" },
            { "vi": "2020", "mnong": "2020" }
          ],
          "answer": 1,
          "explain": { "vi": "Năm 2005, UNESCO công nhận Không gian văn hóa Cồng chiêng Tây Nguyên là Kiệt tác truyền khẩu và di sản văn hóa phi vật thể của nhân loại.", "mnong": "[M'Nông] Giải thích câu 1" }
        },
        {
          "question": { "vi": "Người M'Nông sinh sống chủ yếu ở vùng nào?", "mnong": "[M'Nông] Câu hỏi 2" },
          "options": [
            { "vi": "Tây Bắc", "mnong": "[M'Nông] Tây Bắc" },
            { "vi": "Đồng bằng sông Hồng", "mnong": "[M'Nông] Đồng bằng sông Hồng" },
            { "vi": "Tây Nguyên", "mnong": "[M'Nông] Tây Nguyên" },
            { "vi": "Đồng bằng sông Cửu Long", "mnong": "[M'Nông] Đồng bằng sông Cửu Long" }
          ],
          "answer": 2,
          "explain": { "vi": "Người M'Nông sinh sống chủ yếu ở vùng Tây Nguyên.", "mnong": "[M'Nông] Giải thích câu 2" }
        },
        {
          "question": { "vi": "Ngôi nhà trong triển lãm này mô phỏng kiểu nhà nào?", "mnong": "[M'Nông] Câu hỏi 3" },
          "options": [
            { "vi": "Nhà dài", "mnong": "[M'Nông] Nhà dài" },
            { "vi": "Nhà ống", "mnong": "[M'Nông] Nhà ống" },
            { "vi": "Nhà mái bằng", "mnong": "[M'Nông] Nhà mái bằng" },
            { "vi": "Nhà hai tầng", "mnong": "[M'Nông] Nhà hai tầng" }
          ],
          "answer": 0,
          "explain": { "vi": "Triển lãm mô phỏng nhà dài với mái tranh và vách đan nan tre.", "mnong": "[M'Nông] Giải thích câu 3" }
        },
        {
          "question": { "vi": "Múa xoang thường được múa theo đội hình nào?", "mnong": "[M'Nông] Câu hỏi 4" },
          "options": [
            { "vi": "Hàng dọc", "mnong": "[M'Nông] Hàng dọc" },
            { "vi": "Vòng tròn", "mnong": "[M'Nông] Vòng tròn" },
            { "vi": "Đứng yên một chỗ", "mnong": "[M'Nông] Đứng yên một chỗ" },
            { "vi": "Hai người đối diện", "mnong": "[M'Nông] Hai người đối diện" }
          ],
          "answer": 1,
          "explain": { "vi": "[Câu hỏi mẫu] Người múa nối nhau thành vòng tròn, chuyển động theo nhịp cồng chiêng.", "mnong": "[M'Nông] Giải thích câu 4" }
        },
        {
          "question": { "vi": "Ở gian Trang phục, bạn có thể làm gì?", "mnong": "[M'Nông] Câu hỏi 5" },
          "options": [
            { "vi": "Mặc thử trang phục để chụp ảnh", "mnong": "[M'Nông] Mặc thử trang phục để chụp ảnh" },
            { "vi": "Mua trang phục", "mnong": "[M'Nông] Mua trang phục" },
            { "vi": "Đặt may trang phục", "mnong": "[M'Nông] Đặt may trang phục" },
            { "vi": "Không có hoạt động nào", "mnong": "[M'Nông] Không có hoạt động nào" }
          ],
          "answer": 0,
          "explain": { "vi": "Góc chụp ảnh cho bạn mặc thử trang phục M'Nông và tải ảnh về máy.", "mnong": "[M'Nông] Giải thích câu 5" }
        }
      ]
    }
  ]
}
```

- [ ] **Step 14: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/content-files.test.ts`
Expected: PASS (2 test). Nếu fail, đọc thông báo (dạng `content/rooms/x.json › exhibits.0.title: ...`) và sửa JSON.

- [ ] **Step 15: Commit**

```bash
git add public/content scripts/lib/paths.ts scripts/lib/read-content.ts src/content/load.ts tests/unit/content-files.test.ts
git commit -m "feat: add sample bilingual content for 7 rooms and content readers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Tạo media mẫu (ảnh, vân, âm thanh, mô hình) và lệnh kiểm tra nội dung

**Files:**
- Create: `scripts/lib/wav.ts`, `scripts/lib/synth.ts`, `scripts/lib/glb.ts`, `scripts/gen-placeholders.ts`, `scripts/check-content.ts`
- Test: `tests/unit/media-gen.test.ts`
- Generated: `public/media/**`

Script chỉ tạo file **còn thiếu**, không ghi đè ảnh thật. Thêm `--force` để tạo lại toàn bộ.

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { encodeWav } from '../../scripts/lib/wav';
import { gongTone, tone, SAMPLE_RATE } from '../../scripts/lib/synth';
import { gongGlb } from '../../scripts/lib/glb';

describe('encodeWav', () => {
  it('ghi header RIFF/WAVE PCM 16-bit mono', () => {
    const buf = encodeWav(new Float32Array([0, 0.5, -0.5, 1]), 22050);
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF');
    expect(buf.toString('ascii', 8, 12)).toBe('WAVE');
    expect(buf.readUInt16LE(22)).toBe(1);
    expect(buf.readUInt32LE(24)).toBe(22050);
    expect(buf.readUInt32LE(40)).toBe(8);
    expect(buf.length).toBe(44 + 8);
    expect(buf.readInt16LE(44 + 6)).toBe(32767);
  });
});

describe('synth', () => {
  it('gongTone dài đúng số mẫu, không vượt biên độ 1', () => {
    const s = gongTone(220, 1);
    expect(s.length).toBe(SAMPLE_RATE);
    expect(Math.max(...s.map(Math.abs))).toBeLessThanOrEqual(1);
  });
  it('tone nối các nốt liên tiếp', () => {
    expect(tone([440, 660], 0.1).length).toBe(Math.floor(0.1 * SAMPLE_RATE) * 2);
  });
});

describe('gongGlb', () => {
  it('tạo file GLB 2.0 hợp lệ', () => {
    const glb = gongGlb();
    expect(glb.readUInt32LE(0)).toBe(0x46546c67);
    expect(glb.readUInt32LE(4)).toBe(2);
    expect(glb.readUInt32LE(8)).toBe(glb.length);
    const jsonLength = glb.readUInt32LE(12);
    expect(glb.readUInt32LE(16)).toBe(0x4e4f534a);
    const json = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength));
    expect(json.asset.version).toBe('2.0');
    expect(json.accessors).toHaveLength(3);
    expect(json.accessors[0].min).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/media-gen.test.ts`
Expected: FAIL, không tìm thấy module `scripts/lib/wav`.

- [ ] **Step 3: Viết `scripts/lib/wav.ts`**

```ts
export function encodeWav(samples: Float32Array, sampleRate: number): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32767), i * 2));
  const header = Buffer.alloc(44);
  header.write('RIFF', 0, 'ascii');
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8, 'ascii');
  header.write('fmt ', 12, 'ascii');
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36, 'ascii');
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
```

- [ ] **Step 4: Viết `scripts/lib/synth.ts`**

```ts
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
```

- [ ] **Step 5: Viết `scripts/lib/glb.ts`**

```ts
import { CylinderGeometry, SphereGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export function geometryToGlb(geo: BufferGeometry, rgba: [number, number, number, number], metallic: number, roughness: number): Buffer {
  const pos = geo.getAttribute('position').array as Float32Array;
  const nor = geo.getAttribute('normal').array as Float32Array;
  const index = geo.getIndex();
  if (!index) throw new Error('geometry phải có index');
  const idx = new Uint32Array(index.array);

  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      min[k] = Math.min(min[k], pos[i + k]);
      max[k] = Math.max(max[k], pos[i + k]);
    }
  }

  const posBuf = Buffer.from(pos.buffer, pos.byteOffset, pos.byteLength);
  const norBuf = Buffer.from(nor.buffer, nor.byteOffset, nor.byteLength);
  const idxBuf = Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength);
  const bin = Buffer.concat([posBuf, norBuf, idxBuf]);

  const json = {
    asset: { version: '2.0', generator: 'trien-lam-mnong placeholder' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, material: 0 }] }],
    materials: [{ pbrMetallicRoughness: { baseColorFactor: rgba, metallicFactor: metallic, roughnessFactor: roughness } }],
    buffers: [{ byteLength: bin.length }],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: posBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length, byteLength: norBuf.length, target: 34962 },
      { buffer: 0, byteOffset: posBuf.length + norBuf.length, byteLength: idxBuf.length, target: 34963 },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: pos.length / 3, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: nor.length / 3, type: 'VEC3' },
      { bufferView: 2, componentType: 5125, count: idx.length, type: 'SCALAR' },
    ],
  };

  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + jsonBuf.length + 8 + bin.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN"
  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, bin]);
}

/** Chiêng mẫu: đĩa tròn có núm ở giữa, mặt quay về +z. */
export function gongGlb(): Buffer {
  const disc = new CylinderGeometry(0.4, 0.4, 0.06, 64);
  disc.rotateX(Math.PI / 2);
  const boss = new SphereGeometry(0.09, 32, 16);
  boss.scale(1, 1, 0.6);
  boss.translate(0, 0, 0.04);
  const merged = mergeGeometries([disc, boss]);
  if (!merged) throw new Error('không ghép được hình chiêng');
  return geometryToGlb(merged, [0.78, 0.6, 0.25, 1], 0.9, 0.35);
}
```

- [ ] **Step 6: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/media-gen.test.ts`
Expected: PASS (4 test).

- [ ] **Step 7: Viết `scripts/gen-placeholders.ts`**

```ts
import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
import { gongGlb } from './lib/glb';
import { PUBLIC_DIR } from './lib/paths';
import { readContent } from './lib/read-content';
import { SAMPLE_RATE, gongTone, tone } from './lib/synth';
import { encodeWav } from './lib/wav';

type Ctx = ReturnType<ReturnType<typeof createCanvas>['getContext']>;
type Draw = (ctx: Ctx, w: number, h: number) => void;

const force = process.argv.includes('--force');
const GONG_FREQS = [174.6, 196, 220, 246.9, 261.6, 293.7];
const FONT = '"Segoe UI", Roboto, Arial, sans-serif';
let written = 0;

async function put(rel: string, make: () => Promise<Buffer> | Buffer): Promise<void> {
  const file = path.join(PUBLIC_DIR, rel);
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

  console.log(`Đã tạo ${written} file mẫu${force ? ' (ghi đè)' : ''}.`);
}

await main();
```

- [ ] **Step 8: Chạy tạo media mẫu**

Run: `npm run assets`
Expected: in ra danh sách `+ public/media/...` và dòng `Đã tạo 54 file mẫu.` Chạy lại lần hai: `Đã tạo 0 file mẫu.`

Mở thử vài file: `public/media/textures/woven.jpg` (ô đan nâu), `public/media/trang-phuc/nam.png` (áo sọc, nền trong suốt), `public/media/share/cong-chieng.jpg` (1200×630).

- [ ] **Step 9: Viết `scripts/check-content.ts`**

```ts
import { ContentError, readContent } from './lib/read-content';

try {
  const { site, rooms } = await readContent({ checkFiles: true });
  const pages = [{ name: 'Trang chủ', seo: site.seo }, ...rooms.map((r) => ({ name: `Gian ${r.order}`, seo: r.seo }))];
  for (const page of pages) {
    if (page.seo.title.length < 50) console.warn(`⚠ ${page.name}: title SEO có ${page.seo.title.length} ký tự (nên 50–60).`);
  }
  const exhibits = rooms.reduce((n, r) => n + r.exhibits.length, 0);
  console.log(`Nội dung hợp lệ: ${rooms.length} gian, ${exhibits} hiện vật, đủ file media.`);
} catch (err) {
  if (err instanceof ContentError) {
    console.error(err.message);
    process.exit(1);
  }
  throw err;
}
```

- [ ] **Step 10: Chạy kiểm tra nội dung**

Run: `npm run check:content`
Expected: `Nội dung hợp lệ: 7 gian, 26 hiện vật, đủ file media.` và không có cảnh báo ⚠.

Thử lỗi: đổi tạm `"youtubeId": "aqz-KE-bpKQ"` trong gian 2 thành `"abc"`, chạy lại, thấy `content/rooms/02-le-cau-mua.json › exhibits.2.youtubeId: youtubeId phải có đúng 11 ký tự` và mã thoát 1. Hoàn tác.

- [ ] **Step 11: Commit**

```bash
git add scripts tests/unit/media-gen.test.ts public/media
git commit -m "feat: generate placeholder media and add content check" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Link (route) và bố cục nhà dài (layout)

**Files:**
- Create: `src/nav/route.ts`, `src/scene/layout.ts`
- Test: `tests/unit/route-layout.test.ts`

Quy ước hướng: nhà chạy dọc trục x, cửa ở x = 0, cuối nhà ở x = 69. Vách trái z = −5, vách phải z = +5. Camera có `yaw = 0` thì nhìn về −z; `FACE_FORWARD = −π/2` thì nhìn dọc nhà về +x.

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { exhibitUrl, parseRoute, roomPath } from '../../src/nav/route';
import {
  FACE_FORWARD,
  HOUSE_LENGTH,
  clampToWalkable,
  exhibitAnchor,
  roomIndexAt,
  roomStartX,
  standpoints,
  viewpointFor,
  yawToward,
} from '../../src/scene/layout';

describe('route', () => {
  it('đọc trang chủ', () => {
    expect(parseRoute('/', '')).toEqual({ slug: null, exhibitId: null, lang: null });
  });
  it('đọc gian, hiện vật và ngôn ngữ', () => {
    expect(parseRoute('/phong/cong-chieng/', '?v=bo-chieng&lang=mnong')).toEqual({ slug: 'cong-chieng', exhibitId: 'bo-chieng', lang: 'mnong' });
    expect(parseRoute('/phong/cong-chieng', '')).toEqual({ slug: 'cong-chieng', exhibitId: null, lang: null });
  });
  it('bỏ qua giá trị lạ', () => {
    expect(parseRoute('/phong/cong-chieng/', '?v=<script>&lang=en')).toEqual({ slug: 'cong-chieng', exhibitId: null, lang: null });
    expect(parseRoute('/khac/', '?v=a')).toEqual({ slug: null, exhibitId: null, lang: null });
  });
  it('tạo link gian và link hiện vật', () => {
    expect(roomPath('le-cau-mua')).toBe('/phong/le-cau-mua/');
    expect(exhibitUrl('https://a.com/', 'cong-chieng', 'bo-chieng')).toBe('https://a.com/phong/cong-chieng/?v=bo-chieng');
  });
});

describe('layout', () => {
  it('nhà dài 69m', () => {
    expect(HOUSE_LENGTH).toBe(69);
    expect(roomStartX(1)).toBe(6);
    expect(roomStartX(7)).toBe(60);
  });
  it('roomIndexAt: sân −1, sảnh 0, gian 1–7', () => {
    expect(roomIndexAt(-1)).toBe(-1);
    expect(roomIndexAt(3)).toBe(0);
    expect(roomIndexAt(6)).toBe(1);
    expect(roomIndexAt(14.9)).toBe(1);
    expect(roomIndexAt(15)).toBe(2);
    expect(roomIndexAt(68.9)).toBe(7);
    expect(roomIndexAt(100)).toBe(7);
  });
  it('mỗi gian có 2 điểm đứng, cộng sân và sảnh', () => {
    const sps = standpoints();
    expect(sps).toHaveLength(16);
    expect(sps[0]).toMatchObject({ id: 'san-truoc', roomIndex: -1 });
    expect(sps[1]).toMatchObject({ id: 'sanh', roomIndex: 0 });
    for (let o = 1; o <= 7; o++) expect(sps.filter((s) => s.roomIndex === o)).toHaveLength(2);
  });
  it('vị trí hiện vật trên vách', () => {
    const left = exhibitAnchor(1, 'left', 0);
    expect(left.x).toBe(7.5);
    expect(left.z).toBeCloseTo(-4.88);
    expect(left.facing).toBe(0);
    const right = exhibitAnchor(1, 'right', 2);
    expect(right.x).toBe(13.5);
    expect(right.z).toBeCloseTo(4.88);
    expect(right.facing).toBeCloseTo(Math.PI);
  });
  it('điểm nhìn hiện vật nằm gần lối giữa, cùng phía vách', () => {
    expect(viewpointFor({ x: 7.5, z: -4.88 })).toEqual({ x: 7.5, z: -1.2 });
    expect(viewpointFor({ x: 7.5, z: 4.88 })).toEqual({ x: 7.5, z: 1.2 });
  });
  it('giới hạn chỗ đi trong nhà và ngoài sân', () => {
    const inside = clampToWalkable(100, 9, true);
    expect(inside.x).toBeCloseTo(68.4);
    expect(inside.z).toBe(4);
    expect(clampToWalkable(5, 20, false)).toEqual({ x: -1, z: 9 });
  });
  it('yawToward', () => {
    expect(yawToward({ x: 0, z: 0 }, { x: 0, z: -1 })).toBeCloseTo(0);
    expect(yawToward({ x: 0, z: 0 }, { x: 1, z: 0 })).toBeCloseTo(FACE_FORWARD);
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/route-layout.test.ts`
Expected: FAIL, không tìm thấy module `src/nav/route`.

- [ ] **Step 3: Viết `src/nav/route.ts`**

```ts
import type { Lang } from '../content/schema';

export interface Route {
  slug: string | null;
  exhibitId: string | null;
  lang: Lang | null;
}

const SAFE_ID = /^[a-z0-9-]+$/;

export function parseRoute(pathname: string, search: string): Route {
  const match = pathname.match(/^\/phong\/([a-z0-9-]+)\/?$/);
  const params = new URLSearchParams(search);
  const v = params.get('v');
  const lang = params.get('lang');
  return {
    slug: match ? match[1] : null,
    exhibitId: match && v && SAFE_ID.test(v) ? v : null,
    lang: lang === 'vi' || lang === 'mnong' ? lang : null,
  };
}

export function roomPath(slug: string): string {
  return `/phong/${slug}/`;
}

export function exhibitUrl(siteUrl: string, slug: string, exhibitId: string): string {
  return `${siteUrl.replace(/\/$/, '')}${roomPath(slug)}?v=${encodeURIComponent(exhibitId)}`;
}
```

- [ ] **Step 4: Viết `src/scene/layout.ts`**

```ts
import { ROOM_COUNT } from '../content/schema';
import { clamp } from '../util/math';

export const HALL_LENGTH = 6;
export const ROOM_LENGTH = 9;
export const HOUSE_LENGTH = HALL_LENGTH + ROOM_LENGTH * ROOM_COUNT;
export const HALF_WIDTH = 5;
export const WALL_HEIGHT = 3.2;
export const EYE_HEIGHT = 1.6;
export const DOOR_HALF_WIDTH = 1.4;
/** Hướng nhìn dọc nhà, về phía cuối nhà (+x). */
export const FACE_FORWARD = -Math.PI / 2;

const WALL_INSET = 0.12;
const VIEW_Z = 1.2;

export interface Point {
  x: number;
  z: number;
}
export interface Standpoint extends Point {
  id: string;
  /** −1 sân trước, 0 sảnh, 1–7 các gian. */
  roomIndex: number;
}
export interface Anchor extends Point {
  /** rotation.y để mặt trước (+z cục bộ) quay ra lối giữa. */
  facing: number;
}

export function roomStartX(order: number): number {
  return HALL_LENGTH + (order - 1) * ROOM_LENGTH;
}

export function roomIndexAt(x: number): number {
  if (x < 0) return -1;
  if (x < HALL_LENGTH) return 0;
  return Math.min(ROOM_COUNT, Math.floor((x - HALL_LENGTH) / ROOM_LENGTH) + 1);
}

export function standpoints(): Standpoint[] {
  const list: Standpoint[] = [
    { id: 'san-truoc', roomIndex: -1, x: -9, z: 0 },
    { id: 'sanh', roomIndex: 0, x: 3, z: 0 },
  ];
  for (let order = 1; order <= ROOM_COUNT; order++) {
    const start = roomStartX(order);
    list.push({ id: `gian-${order}-a`, roomIndex: order, x: start + 2.5, z: 0 });
    list.push({ id: `gian-${order}-b`, roomIndex: order, x: start + 6.5, z: 0 });
  }
  return list;
}

export function exhibitAnchor(order: number, wall: 'left' | 'right', slot: number): Anchor {
  return {
    x: roomStartX(order) + 1.5 + slot * 3,
    z: wall === 'left' ? -HALF_WIDTH + WALL_INSET : HALF_WIDTH - WALL_INSET,
    facing: wall === 'left' ? 0 : Math.PI,
  };
}

export function viewpointFor(anchor: Point): Point {
  return { x: anchor.x, z: anchor.z < 0 ? -VIEW_Z : VIEW_Z };
}

export function clampToWalkable(x: number, z: number, inside: boolean): Point {
  if (inside) return { x: clamp(x, 0.4, HOUSE_LENGTH - 0.6), z: clamp(z, -HALF_WIDTH + 1, HALF_WIDTH - 1) };
  return { x: clamp(x, -16, -1), z: clamp(z, -9, 9) };
}

/** yaw để camera đứng ở `from` nhìn về `to`. */
export function yawToward(from: Point, to: Point): number {
  return Math.atan2(-(to.x - from.x), -(to.z - from.z));
}
```

- [ ] **Step 5: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/route-layout.test.ts`
Expected: PASS (11 test).

- [ ] **Step 6: Commit**

```bash
git add src/nav/route.ts src/scene/layout.ts tests/unit/route-layout.test.ts
git commit -m "feat: add URL routing and longhouse layout" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Cảnh 3D: renderer, vân bề mặt, nhà dài, chữ trên bảng

**Files:**
- Create: `src/scene/renderer.ts`, `src/scene/textures.ts`, `src/scene/house.ts`, `src/scene/label.ts`

Phần này là hình ảnh; kiểm tra bằng mắt ở Task 9 (sau khi có camera đi được).

- [ ] **Step 1: Viết `src/scene/renderer.ts`**

```ts
import * as THREE from 'three';

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

export function createStage(container: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bcd6ec');
  scene.fog = new THREE.Fog('#bcd6ec', 45, 130);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

  const resize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera };
}
```

- [ ] **Step 2: Viết `src/scene/textures.ts`**

```ts
import * as THREE from 'three';

const loader = new THREE.TextureLoader();

export function loadRepeating(url: string, repeatX: number, repeatY: number): THREE.Texture {
  const tex = loader.load(url);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

type ImageMaterial = THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | THREE.MeshLambertMaterial;

/** Ảnh trưng bày chỉ nạp khi khách tới gần gian đó. Lỗi thì giữ màu trơn. */
export class LazyImages {
  private pending = new Map<number, Array<() => void>>();
  private loaded = new Set<number>();

  add(roomIndex: number, url: string, material: ImageMaterial): void {
    const job = () =>
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          material.map = tex;
          material.color.set('#ffffff');
          material.needsUpdate = true;
        },
        undefined,
        () => console.warn(`Không tải được ảnh ${url}`),
      );
    if (this.loaded.has(roomIndex)) {
      job();
      return;
    }
    const list = this.pending.get(roomIndex) ?? [];
    list.push(job);
    this.pending.set(roomIndex, list);
  }

  ensure(roomIndices: number[]): void {
    for (const index of roomIndices) {
      if (this.loaded.has(index)) continue;
      this.loaded.add(index);
      this.pending.get(index)?.forEach((job) => job());
      this.pending.delete(index);
    }
  }
}
```

- [ ] **Step 3: Viết `src/scene/house.ts`**

```ts
import * as THREE from 'three';
import { DOOR_HALF_WIDTH, HALF_WIDTH, HALL_LENGTH, HOUSE_LENGTH, ROOM_LENGTH, WALL_HEIGHT } from './layout';
import { ROOM_COUNT } from '../content/schema';
import type { HitData } from '../nav/picker';
import { loadRepeating } from './textures';

const RIDGE_HEIGHT = 7.5;
const EAVE = 0.8;
const DOOR_HEIGHT = 2.4;

export interface House {
  /** Vật cản tia chạm (vách) để không chạm xuyên tường. */
  blockers: THREE.Object3D[];
  door: THREE.Object3D;
}

export function buildHouse(scene: THREE.Scene): House {
  const blockers: THREE.Object3D[] = [];
  const lambert = (url: string, rx: number, ry: number) => new THREE.MeshLambertMaterial({ map: loadRepeating(url, rx, ry) });
  const woven = (rx: number, ry: number) => lambert('/media/textures/woven.jpg', rx, ry);
  const wood = new THREE.MeshLambertMaterial({ map: loadRepeating('/media/textures/wood.jpg', 1, 1) });

  scene.add(new THREE.HemisphereLight('#fff4e0', '#5a4632', 1.7));
  const sun = new THREE.DirectionalLight('#ffffff', 1.1);
  sun.position.set(-20, 30, 15);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), lambert('/media/textures/ground.jpg', 60, 60));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HOUSE_LENGTH, HALF_WIDTH * 2),
    lambert('/media/textures/floor.jpg', HOUSE_LENGTH / 3, 3),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(HOUSE_LENGTH / 2, 0.005, 0);
  scene.add(floor);

  const wall = (width: number, height: number, mat: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.15), mat);

  // Hai vách dọc + chân đá bên ngoài
  for (const side of [-1, 1]) {
    const long = wall(HOUSE_LENGTH, WALL_HEIGHT, woven(HOUSE_LENGTH / 2, WALL_HEIGHT / 2));
    long.position.set(HOUSE_LENGTH / 2, WALL_HEIGHT / 2, side * HALF_WIDTH);
    scene.add(long);
    blockers.push(long);
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(HOUSE_LENGTH + 0.4, 0.45, 0.3),
      lambert('/media/textures/stone.jpg', HOUSE_LENGTH / 2, 0.5),
    );
    plinth.position.set(HOUSE_LENGTH / 2, 0.22, side * (HALF_WIDTH + 0.2));
    scene.add(plinth);
  }

  // Vách hồi cuối nhà
  const back = wall(HALF_WIDTH * 2, WALL_HEIGHT, woven(5, WALL_HEIGHT / 2));
  back.rotation.y = Math.PI / 2;
  back.position.set(HOUSE_LENGTH, WALL_HEIGHT / 2, 0);
  scene.add(back);
  blockers.push(back);

  // Vách hồi đầu nhà có khoảng trống làm cửa
  const sideWidth = HALF_WIDTH - DOOR_HALF_WIDTH;
  for (const side of [-1, 1]) {
    const part = wall(sideWidth, WALL_HEIGHT, woven(sideWidth / 2, WALL_HEIGHT / 2));
    part.rotation.y = Math.PI / 2;
    part.position.set(0, WALL_HEIGHT / 2, side * (DOOR_HALF_WIDTH + sideWidth / 2));
    scene.add(part);
    blockers.push(part);
  }
  const lintel = wall(DOOR_HALF_WIDTH * 2, WALL_HEIGHT - DOOR_HEIGHT, wood);
  lintel.rotation.y = Math.PI / 2;
  lintel.position.set(0, DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2, 0);
  scene.add(lintel);
  blockers.push(lintel);

  // Hai cánh cửa gỗ mở vào trong
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, DOOR_HEIGHT, 0.08), wood);
    leaf.position.set(0.7, DOOR_HEIGHT / 2, side * (DOOR_HALF_WIDTH - 0.06));
    scene.add(leaf);
  }

  // Vùng chạm vô hình ở khung cửa
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, DOOR_HEIGHT, DOOR_HALF_WIDTH * 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  door.position.set(0, DOOR_HEIGHT / 2, 0);
  door.userData.hit = { kind: 'door' } satisfies HitData;
  scene.add(door);

  // Thềm gỗ trước cửa
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 4), wood);
  deck.position.set(-1.2, 0.06, 0);
  scene.add(deck);

  // Tam giác hồi trên hai đầu
  const gable = new THREE.Shape();
  gable.moveTo(-(HALF_WIDTH + EAVE), 0);
  gable.lineTo(HALF_WIDTH + EAVE, 0);
  gable.lineTo(0, RIDGE_HEIGHT - WALL_HEIGHT);
  gable.closePath();
  const gableTex = loadRepeating('/media/textures/woven.jpg', 0.5, 0.5);
  for (const x of [0, HOUSE_LENGTH]) {
    const tri = new THREE.Mesh(new THREE.ShapeGeometry(gable), new THREE.MeshLambertMaterial({ map: gableTex, side: THREE.DoubleSide }));
    tri.rotation.y = Math.PI / 2;
    tri.position.set(x, WALL_HEIGHT, 0);
    scene.add(tri);
  }

  // Mái tranh hai dốc
  const run = HALF_WIDTH + EAVE;
  const rise = RIDGE_HEIGHT - WALL_HEIGHT;
  const slope = Math.hypot(run, rise);
  const roofLength = HOUSE_LENGTH + EAVE * 2;
  const thatch = new THREE.MeshLambertMaterial({ map: loadRepeating('/media/textures/thatch.jpg', roofLength / 2, slope / 2), side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(roofLength, slope), thatch);
    roof.rotation.x = -side * Math.atan2(run, rise);
    roof.position.set(HOUSE_LENGTH / 2, WALL_HEIGHT + rise / 2, (side * run) / 2);
    scene.add(roof);
  }

  // Cột và xà ở ranh giới các gian
  const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, WALL_HEIGHT, 12);
  const beamGeo = new THREE.BoxGeometry(0.2, 0.25, HALF_WIDTH * 2);
  for (let i = 0; i < ROOM_COUNT; i++) {
    const x = HALL_LENGTH + i * ROOM_LENGTH;
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(pillarGeo, wood);
      pillar.position.set(x, WALL_HEIGHT / 2, side * (HALF_WIDTH - 0.3));
      scene.add(pillar);
    }
    const beam = new THREE.Mesh(beamGeo, wood);
    beam.position.set(x, WALL_HEIGHT - 0.1, 0);
    scene.add(beam);
  }

  return { blockers, door };
}
```

- [ ] **Step 4: Viết `src/scene/label.ts`**

```ts
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

const PX_PER_METER = 400;
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
  const pad = Math.round(o.fontPx * 0.8);
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
    const size = isHeading ? Math.round(o.fontPx * 1.25) : o.fontPx;
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
```

- [ ] **Step 5: Tạo `src/nav/picker.ts` (house.ts cần kiểu `HitData`)**

```ts
import * as THREE from 'three';

export type HitData =
  | { kind: 'standpoint'; x: number; z: number }
  | { kind: 'door' }
  | { kind: 'exhibit'; exhibitKey: string }
  | { kind: 'gong'; exhibitKey: string; index: number };

const raycaster = new THREE.Raycaster();
raycaster.far = 25;
const ndc = new THREE.Vector2();

/** Vật đầu tiên tia chạm trúng; vật không có `userData.hit` (như vách) chặn tia. */
export function pickHit(camera: THREE.Camera, targets: THREE.Object3D[], el: HTMLElement, clientX: number, clientY: number): HitData | null {
  const rect = el.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const first = raycaster.intersectObjects(targets, false)[0];
  return (first?.object.userData.hit as HitData | undefined) ?? null;
}
```

- [ ] **Step 6: Typecheck**

Run: `npm run typecheck`
Expected: không có lỗi.

- [ ] **Step 7: Commit**

```bash
git add src/scene src/nav/picker.ts
git commit -m "feat: build longhouse scene, textures and canvas labels" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9: Camera di chuyển: rig, chạm/kéo, W A S D

**Files:**
- Create: `src/nav/rig.ts`, `src/nav/input.ts`
- Modify: `src/main.ts` (bản tạm để đi thử trong nhà trống)
- Test: `tests/unit/rig.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { PerspectiveCamera } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { axisFromKeys } from '../../src/nav/input';
import { CameraRig } from '../../src/nav/rig';
import { EYE_HEIGHT, FACE_FORWARD } from '../../src/scene/layout';

const run = (rig: CameraRig, seconds: number) => {
  for (let t = 0; t < seconds; t += 0.05) rig.update(0.05);
};

describe('CameraRig', () => {
  it('teleport đặt vị trí và biết đang trong hay ngoài nhà', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(-9, 0, FACE_FORWARD);
    expect(rig.inside).toBe(false);
    rig.teleport(3, 0, FACE_FORWARD);
    expect(rig.inside).toBe(true);
  });

  it('moveTo trượt tới đích, gọi done một lần, cập nhật inside', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(-9, 0, FACE_FORWARD);
    const done = vi.fn();
    rig.moveTo(3, 0, FACE_FORWARD, done);
    expect(rig.moving).toBe(true);
    run(rig, 3);
    expect(rig.x).toBeCloseTo(3);
    expect(rig.inside).toBe(true);
    expect(rig.moving).toBe(false);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('walk đi theo hướng nhìn và không ra khỏi vách', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(3, 0, FACE_FORWARD);
    rig.walk(1, 0);
    expect(rig.x).toBeCloseTo(4);
    expect(rig.z).toBeCloseTo(0);
    rig.walk(0, -100);
    expect(rig.z).toBe(-4);
  });

  it('walk bị bỏ qua khi đang trượt', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(3, 0, FACE_FORWARD);
    rig.moveTo(10, 0, FACE_FORWARD);
    rig.walk(5, 0);
    expect(rig.x).toBe(3);
  });

  it('apply đặt camera ở tầm mắt', () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera);
    rig.teleport(3, 1, FACE_FORWARD);
    rig.apply();
    expect(camera.position.toArray()).toEqual([3, EYE_HEIGHT, 1]);
  });
});

describe('axisFromKeys', () => {
  it('W/S tiến lùi, A/D sang ngang, mũi tên tương đương', () => {
    expect(axisFromKeys(new Set(['w']))).toEqual({ forward: 1, strafe: 0 });
    expect(axisFromKeys(new Set(['arrowdown', 'd']))).toEqual({ forward: -1, strafe: 1 });
    expect(axisFromKeys(new Set(['w', 's', 'a']))).toEqual({ forward: 0, strafe: -1 });
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/rig.test.ts`
Expected: FAIL, không tìm thấy module `src/nav/input`.

- [ ] **Step 3: Viết `src/nav/rig.ts`**

```ts
import type * as THREE from 'three';
import { EYE_HEIGHT, clampToWalkable } from '../scene/layout';
import { clamp, easeInOut, shortestAngle } from '../util/math';

interface Tween {
  fromX: number;
  fromZ: number;
  fromYaw: number;
  toX: number;
  toZ: number;
  dYaw: number;
  t: number;
  duration: number;
  done?: () => void;
}

export class CameraRig {
  x = 0;
  z = 0;
  yaw = 0;
  pitch = 0;
  inside = false;
  private tween: Tween | null = null;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  get moving(): boolean {
    return this.tween !== null;
  }

  teleport(x: number, z: number, yaw: number): void {
    this.tween = null;
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.pitch = 0;
    this.inside = x >= 0;
  }

  moveTo(x: number, z: number, yaw: number, done?: () => void): void {
    const distance = Math.hypot(x - this.x, z - this.z);
    this.tween = {
      fromX: this.x,
      fromZ: this.z,
      fromYaw: this.yaw,
      toX: x,
      toZ: z,
      dYaw: shortestAngle(this.yaw, yaw),
      t: 0,
      duration: clamp(distance / 6, 0.35, 1.6),
      done,
    };
  }

  look(dYaw: number, dPitch: number): void {
    this.yaw += dYaw;
    this.pitch = clamp(this.pitch + dPitch, -0.9, 0.7);
  }

  /** Đi theo hướng nhìn: `forward`, `strafe` tính bằng mét trong khung hình này. */
  walk(forward: number, strafe: number): void {
    if (this.tween) return;
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    const next = clampToWalkable(this.x - s * forward + c * strafe, this.z - c * forward - s * strafe, this.inside);
    this.x = next.x;
    this.z = next.z;
  }

  update(dt: number): void {
    const tw = this.tween;
    if (!tw) return;
    tw.t = Math.min(1, tw.t + dt / tw.duration);
    const k = easeInOut(tw.t);
    this.x = tw.fromX + (tw.toX - tw.fromX) * k;
    this.z = tw.fromZ + (tw.toZ - tw.fromZ) * k;
    this.yaw = tw.fromYaw + tw.dYaw * k;
    if (tw.t >= 1) {
      this.tween = null;
      this.inside = this.x >= 0;
      tw.done?.();
    }
  }

  apply(): void {
    this.camera.position.set(this.x, EYE_HEIGHT, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
```

- [ ] **Step 4: Viết `src/nav/input.ts`**

```ts
export interface PointerHandlers {
  onTap(clientX: number, clientY: number): void;
  onLook(dx: number, dy: number): void;
}

const TAP_SLOP = 8;

export function attachPointer(el: HTMLElement, handlers: PointerHandlers): void {
  let active: { id: number; startX: number; startY: number; lastX: number; lastY: number; dragging: boolean } | null = null;

  el.addEventListener('pointerdown', (e) => {
    if (active || (e.pointerType === 'mouse' && e.button !== 0)) return;
    active = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, dragging: false };
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    if (!active.dragging && Math.hypot(e.clientX - active.startX, e.clientY - active.startY) > TAP_SLOP) active.dragging = true;
    if (active.dragging) handlers.onLook(e.clientX - active.lastX, e.clientY - active.lastY);
    active.lastX = e.clientX;
    active.lastY = e.clientY;
  });

  const end = (e: PointerEvent, cancelled: boolean) => {
    if (!active || e.pointerId !== active.id) return;
    if (!active.dragging && !cancelled) handlers.onTap(e.clientX, e.clientY);
    active = null;
  };
  el.addEventListener('pointerup', (e) => end(e, false));
  el.addEventListener('pointercancel', (e) => end(e, true));
}

export interface KeyAxis {
  forward: number;
  strafe: number;
}

export function axisFromKeys(down: ReadonlySet<string>): KeyAxis {
  const forward = (down.has('w') || down.has('arrowup') ? 1 : 0) - (down.has('s') || down.has('arrowdown') ? 1 : 0);
  const strafe = (down.has('d') || down.has('arrowright') ? 1 : 0) - (down.has('a') || down.has('arrowleft') ? 1 : 0);
  return { forward, strafe };
}

export function attachKeys(target: Window = window): { axis(): KeyAxis } {
  const down = new Set<string>();
  target.addEventListener('keydown', (e) => {
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    down.add(e.key.toLowerCase());
  });
  target.addEventListener('keyup', (e) => down.delete(e.key.toLowerCase()));
  target.addEventListener('blur', () => down.clear());
  return { axis: () => axisFromKeys(down) };
}
```

- [ ] **Step 5: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/rig.test.ts`
Expected: PASS (6 test).

- [ ] **Step 6: Viết `src/main.ts` bản tạm để đi thử**

Bản này bị thay hoàn toàn ở Task 15.

```ts
import * as THREE from 'three';
import './ui/styles.css';
import { attachKeys, attachPointer } from './nav/input';
import { CameraRig } from './nav/rig';
import { buildHouse } from './scene/house';
import { FACE_FORWARD } from './scene/layout';
import { createStage } from './scene/renderer';

const stageEl = document.getElementById('stage')!;
stageEl.style.cssText = 'position:fixed;inset:0';
const stage = createStage(stageEl);
buildHouse(stage.scene);
const rig = new CameraRig(stage.camera);
rig.teleport(-9, 0, FACE_FORWARD);
attachPointer(stage.renderer.domElement, {
  onTap: () => rig.moveTo(rig.x < 0 ? 3 : rig.x + 9, 0, FACE_FORWARD),
  onLook: (dx, dy) => rig.look(dx * 0.004, dy * 0.003),
});
const keys = attachKeys();
const clock = new THREE.Clock();
stage.renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  const { forward, strafe } = keys.axis();
  rig.walk(forward * 3 * dt, strafe * 3 * dt);
  rig.update(dt);
  rig.apply();
  stage.renderer.render(stage.scene, stage.camera);
});
```

- [ ] **Step 7: Đi thử trong nhà trống**

Run: `npm run dev`, mở `http://localhost:5173`

Expected:
- Thấy sân bê tông, nhà dài mái tranh màu nâu hồng, vách đan, chân đá, cửa mở ở giữa đầu hồi.
- Kéo chuột: xoay nhìn quanh. Bấm 1 lần: trượt vào sảnh. Bấm tiếp: mỗi lần tiến 9m (một gian).
- Bên trong: cột gỗ và xà ở ranh giới mỗi gian, mái phía trên. W A S D đi được, không xuyên vách.
- Mở DevTools → Toggle device toolbar (điện thoại), kéo một ngón vẫn xoay được.

Dừng dev server.

- [ ] **Step 8: Commit**

```bash
git add src/nav/rig.ts src/nav/input.ts src/main.ts tests/unit/rig.test.ts
git commit -m "feat: add camera rig with tap, drag and WASD controls" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Khung giao diện: style, khung thông tin, thanh gian, nút ngôn ngữ, lời chào, thuyết minh

**Files:**
- Create: `src/ui/dom.ts`, `src/ui/panel.ts`, `src/ui/topbar.ts`, `src/ui/roombar.ts`, `src/ui/intro.ts`, `src/ui/toast.ts`, `src/ui/narration.ts`
- Modify: `src/ui/styles.css` (thay toàn bộ)

- [ ] **Step 1: Viết `src/ui/dom.ts`**

```ts
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  for (const child of children) if (child !== null && child !== undefined && child !== false) el.append(child);
  return el;
}

export function paragraphs(text: string): HTMLParagraphElement[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => h('p', {}, p));
}
```

- [ ] **Step 2: Viết `src/ui/panel.ts`**

```ts
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export interface PanelContent {
  el: HTMLElement;
  /** Vẽ lại chữ theo ngôn ngữ hiện tại, giữ nguyên trạng thái. */
  update(): void;
  dispose(): void;
}

export class Panel {
  private readonly root: HTMLElement;
  private readonly titleEl: HTMLHeadingElement;
  private readonly body: HTMLElement;
  private readonly closeBtn: HTMLButtonElement;
  private current: { key: string; title: () => string; content: PanelContent } | null = null;

  constructor(host: HTMLElement) {
    this.titleEl = h('h2', { id: 'panel-title' });
    this.closeBtn = h('button', { type: 'button', class: 'panel-close' }, '✕');
    this.closeBtn.addEventListener('click', () => this.close());
    const head = h('div', { class: 'panel-head' }, h('span', { class: 'panel-grip' }), this.titleEl, this.closeBtn);
    this.body = h('div', { class: 'panel-body' });
    this.root = h('aside', { class: 'panel', 'aria-labelledby': 'panel-title', 'aria-hidden': 'true' }, head, this.body);
    host.append(this.root);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    let startY: number | null = null;
    head.addEventListener('pointerdown', (e) => {
      startY = e.clientY;
    });
    head.addEventListener('pointerup', (e) => {
      if (startY !== null && e.clientY - startY > 60) this.close();
      startY = null;
    });
    this.relangChrome();
  }

  get openKey(): string | null {
    return this.current?.key ?? null;
  }

  open(key: string, title: () => string, content: PanelContent): void {
    this.current?.content.dispose();
    this.current = { key, title, content };
    this.titleEl.textContent = title();
    this.body.replaceChildren(content.el);
    this.body.scrollTop = 0;
    this.root.classList.add('open');
    this.root.setAttribute('aria-hidden', 'false');
    this.closeBtn.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.current) return;
    this.current.content.dispose();
    this.current = null;
    this.root.classList.remove('open');
    this.root.setAttribute('aria-hidden', 'true');
    this.body.replaceChildren();
  }

  relang(): void {
    this.relangChrome();
    if (!this.current) return;
    this.titleEl.textContent = this.current.title();
    this.current.content.update();
  }

  private relangChrome(): void {
    this.closeBtn.setAttribute('aria-label', t(UI.close));
  }
}
```

- [ ] **Step 3: Viết `src/ui/topbar.ts`**

```ts
import type { Site } from '../content/schema';
import { getLang, setLang, t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export function createTopBar(host: HTMLElement, site: Site): { relang(): void } {
  const title = h('span', { class: 'site-title' });
  const vi = h('button', { type: 'button' }, 'VI');
  const mnong = h('button', { type: 'button' }, "M'Nông");
  vi.addEventListener('click', () => setLang('vi'));
  mnong.addEventListener('click', () => setLang('mnong'));
  const group = h('div', { class: 'lang', role: 'group' }, vi, mnong);
  host.append(h('header', { class: 'topbar' }, title, group));

  const relang = () => {
    const lang = getLang();
    title.textContent = t(site.name);
    vi.setAttribute('aria-pressed', String(lang === 'vi'));
    mnong.setAttribute('aria-pressed', String(lang === 'mnong'));
    group.setAttribute('aria-label', t(UI.language));
  };
  relang();
  return { relang };
}
```

- [ ] **Step 4: Viết `src/ui/roombar.ts`**

```ts
import type { Room } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export interface RoomBar {
  setCurrent(index: number): void;
  relang(): void;
}

/** index: −1 sân trước, 0 sảnh, 1–7 các gian (rooms đã sắp theo order). */
export function createRoomBar(host: HTMLElement, rooms: Room[], onGo: (index: number) => void): RoomBar {
  let current = -1;
  const prev = h('button', { type: 'button', class: 'rb-prev' });
  const label = h('button', { type: 'button', class: 'rb-current', 'aria-haspopup': 'true', 'aria-expanded': 'false' });
  const next = h('button', { type: 'button', class: 'rb-next' });
  const list = h('ul', { class: 'roomlist', hidden: '' });
  host.append(list, h('nav', { class: 'roombar' }, prev, label, next));

  const toggleList = (open: boolean) => {
    list.hidden = !open;
    label.setAttribute('aria-expanded', String(open));
  };
  prev.addEventListener('click', () => onGo(Math.max(-1, current - 1)));
  next.addEventListener('click', () => onGo(Math.min(rooms.length, current + 1)));
  label.addEventListener('click', () => toggleList(list.hidden));

  const nameOf = (i: number) =>
    i === -1 ? t(UI.courtyard) : i === 0 ? t(UI.hall) : `${i}/${rooms.length} · ${t(rooms[i - 1].name)}`;

  const render = () => {
    prev.replaceChildren('◀ ', h('span', { class: 'w' }, t(UI.prevRoom)));
    next.replaceChildren(h('span', { class: 'w' }, t(UI.nextRoom)), ' ▶');
    prev.disabled = current <= -1;
    next.disabled = current >= rooms.length;
    label.textContent = nameOf(current);
    list.setAttribute('aria-label', t(UI.roomList));
    list.replaceChildren(
      ...[0, ...rooms.map((r) => r.order)].map((i) => {
        const item = h('button', { type: 'button', 'aria-current': String(i === current) }, i === 0 ? t(UI.hall) : `${i}. ${t(rooms[i - 1].name)}`);
        item.addEventListener('click', () => {
          toggleList(false);
          onGo(i);
        });
        return h('li', {}, item);
      }),
    );
  };
  render();

  return {
    setCurrent(index) {
      current = index;
      render();
    },
    relang: render,
  };
}
```

- [ ] **Step 5: Viết `src/ui/intro.ts`**

```ts
import type { Site } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export function createIntro(host: HTMLElement, site: Site, onEnter: () => void): { hide(): void; relang(): void } {
  const title = h('p', { class: 'intro-title' });
  const welcome = h('p', {});
  const hint = h('p', { class: 'note' });
  const enter = h('button', { type: 'button', class: 'btn' });
  enter.addEventListener('click', onEnter);
  const el = h('div', { class: 'intro' }, h('div', { class: 'intro-card' }, title, welcome, hint, enter));
  host.append(el);

  const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
  const relang = () => {
    title.textContent = t(site.name);
    welcome.textContent = t(site.welcome);
    hint.textContent = t(finePointer ? UI.hintDesktop : UI.hint);
    enter.textContent = t(UI.enter);
  };
  relang();
  return {
    hide: () => {
      el.hidden = true;
    },
    relang,
  };
}
```

- [ ] **Step 6: Viết `src/ui/toast.ts`**

```ts
import { h } from './dom';

export function showToast(text: string): void {
  const el = h('div', { class: 'toast', role: 'status' }, text);
  document.body.append(el);
  setTimeout(() => el.remove(), 1700);
}
```

- [ ] **Step 7: Viết `src/ui/narration.ts`**

```ts
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';
import type { PanelContent } from './panel';

const audio = typeof Audio === 'undefined' ? null : new Audio();
let currentSrc: string | null = null;
const failed = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

audio?.addEventListener('ended', () => {
  currentSrc = null;
  emit();
});
audio?.addEventListener('error', () => {
  if (currentSrc) failed.add(currentSrc);
  currentSrc = null;
  emit();
});

export function playNarration(src: string): void {
  if (!audio) return;
  audio.src = src;
  currentSrc = src;
  audio.play().catch(() => {
    currentSrc = null;
    emit();
  });
  emit();
}

export function stopNarration(): void {
  if (!audio || !currentSrc) return;
  audio.pause();
  currentSrc = null;
  emit();
}

/** Nút ▶/■ thuyết minh; ẩn khi ngôn ngữ đang chọn không có file. */
export function narrationButton(getSrc: () => string | null): PanelContent {
  const el = h('button', { type: 'button', class: 'btn narr' });
  el.addEventListener('click', () => {
    const src = getSrc();
    if (!src) return;
    if (currentSrc === src) stopNarration();
    else playNarration(src);
  });
  const render = () => {
    const src = getSrc();
    el.hidden = !src;
    if (!src) return;
    el.disabled = failed.has(src);
    el.textContent = failed.has(src) ? t(UI.audioError) : currentSrc === src ? `■ ${t(UI.stop)}` : `▶ ${t(UI.listen)}`;
  };
  listeners.add(render);
  render();
  return {
    el,
    update: () => {
      // Đổi ngôn ngữ: dừng giọng cũ.
      if (currentSrc && currentSrc !== getSrc()) stopNarration();
      render();
    },
    dispose: () => {
      listeners.delete(render);
      if (currentSrc && currentSrc === getSrc()) stopNarration();
    },
  };
}
```

- [ ] **Step 8: Thay toàn bộ `src/ui/styles.css`**

```css
:root {
  --brown: #3b2a1a;
  --wood: #7d5530;
  --cream: #f6ecd9;
  --paper: #fffaf1;
  --accent: #e2572b;
  --ok: #2e7d32;
  --bad: #c62828;
  --ink: #2a1e12;
  --muted: #6b5a45;
  --radius: 14px;
  font-family: "Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif;
  color: var(--ink);
}
* { box-sizing: border-box; }
[hidden] { display: none !important; }
html, body { margin: 0; min-height: 100%; background: var(--cream); }
body.mode-3d { overflow: hidden; height: 100%; }

/* Cảnh 3D */
#stage { position: fixed; inset: 0; background: #bcd6ec; z-index: 1; }
#stage:empty::after {
  content: "Đang tải nhà dài…";
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: var(--brown); font-size: 16px;
}
#stage canvas { width: 100%; height: 100%; display: block; touch-action: none; }
body.mode-text #stage { display: none; }

/* Lớp giao diện phủ trên cảnh */
#ui { position: fixed; inset: 0; pointer-events: none; z-index: 10; }
#ui > * { pointer-events: auto; }
#ui > .topbar { pointer-events: none; }
#ui > .topbar > * { pointer-events: auto; }

/* Bản chữ HTML: ẩn khỏi mắt ở chế độ 3D, vẫn có cho Google và trình đọc màn hình */
body.mode-3d #text-version {
  position: absolute; width: 1px; height: 1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap;
}
#text-version { max-width: 760px; margin: 0 auto; padding: 72px 16px 48px; line-height: 1.6; }
#text-version h1 { font-size: 28px; line-height: 1.25; }
#text-version h2 { font-size: 20px; margin: 0 0 8px; }
#text-version section { background: var(--paper); border-radius: var(--radius); padding: 16px; margin: 16px 0; }
#text-version img { max-width: 100%; height: auto; border-radius: 8px; display: block; }
#text-version figure { margin: 0 0 12px; }
#text-version footer { margin-top: 32px; }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  border: 0; border-radius: 999px; background: var(--wood); color: #fff;
  padding: 10px 18px; font: inherit; font-size: 15px; min-height: 44px; cursor: pointer; text-decoration: none;
}
.btn.secondary { background: var(--cream); color: var(--brown); }
.btn:disabled { opacity: 0.5; cursor: default; }
.btn.pulse { animation: pulse 1s ease-in-out 3; }
@keyframes pulse { 50% { transform: scale(1.06); } }
.note { font-size: 13px; color: var(--muted); }

/* Thanh trên */
.topbar {
  position: fixed; top: 0; left: 0; right: 0; display: flex; justify-content: space-between; align-items: center;
  gap: 12px; padding: max(10px, env(safe-area-inset-top)) 12px 10px;
}
.site-title { font-weight: 700; color: #fff; text-shadow: 0 1px 3px #0009; font-size: 15px; }
.lang { display: flex; background: #0008; border-radius: 999px; padding: 3px; flex-shrink: 0; }
.lang button { border: 0; background: transparent; color: #fff; padding: 8px 12px; border-radius: 999px; font: inherit; font-size: 14px; cursor: pointer; }
.lang button[aria-pressed="true"] { background: var(--cream); color: var(--brown); font-weight: 700; }
body.mode-text .topbar { background: var(--paper); box-shadow: 0 1px 6px #0002; }
body.mode-text .site-title { color: var(--brown); text-shadow: none; }

/* Thanh gian */
.roombar {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: max(12px, env(safe-area-inset-bottom));
  display: flex; gap: 4px; align-items: center; background: #000b; border-radius: 999px; padding: 6px;
  width: min(560px, calc(100% - 24px));
}
.roombar button { border: 0; background: transparent; color: #fff; font: inherit; font-size: 14px; padding: 10px 12px; border-radius: 999px; cursor: pointer; min-height: 44px; }
.roombar button:disabled { opacity: 0.35; cursor: default; }
.roombar .rb-current { flex: 1; text-align: center; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #ffffff1a; }
@media (max-width: 420px) { .roombar .w { display: none; } }
.roomlist {
  position: fixed; left: 50%; transform: translateX(-50%); bottom: calc(max(12px, env(safe-area-inset-bottom)) + 64px);
  width: min(420px, calc(100% - 24px)); max-height: 60vh; overflow: auto;
  background: var(--paper); border-radius: var(--radius); box-shadow: 0 8px 30px #0005; padding: 8px; margin: 0; list-style: none;
}
.roomlist button { width: 100%; text-align: left; border: 0; background: transparent; padding: 12px; border-radius: 10px; font: inherit; cursor: pointer; }
.roomlist button[aria-current="true"] { background: var(--cream); font-weight: 700; }

/* Lời chào ban đầu */
.intro { position: fixed; inset: 0; display: flex; align-items: flex-end; justify-content: center; padding: 16px; background: linear-gradient(transparent 35%, #000a); }
.intro-card { background: var(--paper); border-radius: 18px; padding: 20px; max-width: 480px; width: 100%; margin-bottom: 72px; box-shadow: 0 10px 30px #0006; }
.intro-title { font-size: 22px; font-weight: 700; margin: 0 0 8px; }

/* Khung thông tin */
.panel {
  position: fixed; left: 0; right: 0; bottom: 0; max-height: 78vh; z-index: 20;
  background: var(--paper); border-radius: 18px 18px 0 0; box-shadow: 0 -8px 30px #0004;
  display: flex; flex-direction: column; transform: translateY(105%); transition: transform 0.25s ease; visibility: hidden;
}
.panel.open { transform: none; visibility: visible; }
.panel-head { position: relative; display: flex; align-items: center; gap: 8px; padding: 16px 12px 10px 16px; border-bottom: 1px solid #0001; touch-action: none; }
.panel-head h2 { margin: 0; font-size: 18px; flex: 1; }
.panel-grip { position: absolute; top: 6px; left: 50%; width: 40px; height: 4px; margin-left: -20px; border-radius: 2px; background: #0002; }
.panel-close { width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--cream); font-size: 18px; cursor: pointer; }
.panel-body { overflow: auto; padding: 12px 16px calc(16px + env(safe-area-inset-bottom)); line-height: 1.6; }
@media (min-width: 900px) {
  .panel { left: auto; top: 0; width: 440px; max-height: none; border-radius: 0; transform: translateX(105%); }
  .panel.open { transform: none; }
  .panel-grip { display: none; }
}

/* Ảnh */
.p-gallery { display: flex; gap: 10px; overflow-x: auto; scroll-snap-type: x mandatory; padding-bottom: 6px; }
.p-gallery figure { flex: 0 0 85%; margin: 0; scroll-snap-align: center; }
.p-gallery img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; cursor: zoom-in; display: block; }
.p-gallery figcaption { font-size: 14px; color: var(--muted); margin-top: 4px; }
.media-missing { aspect-ratio: 4 / 3; display: flex; align-items: center; justify-content: center; background: #eadfca; border-radius: 10px; color: var(--muted); padding: 12px; text-align: center; }
.zoom { position: fixed; inset: 0; background: #000e; display: flex; align-items: center; justify-content: center; z-index: 40; cursor: zoom-out; }
.zoom img { max-width: 100%; max-height: 100%; }

/* Video */
.p-video { position: relative; aspect-ratio: 16 / 9; }
.p-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; border-radius: 10px; }

/* AR */
.p-ar model-viewer { width: 100%; height: 320px; background: #efe4cf; border-radius: 12px; }
.p-ar .ar-btn { position: absolute; right: 12px; bottom: 12px; }

/* Chiêng */
.p-gongs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.p-gongs button { border: 0; background: var(--cream); border-radius: 12px; padding: 8px; font: inherit; font-size: 14px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.p-gongs img { width: 100%; aspect-ratio: 1; object-fit: contain; }
.p-gongs button.hit { animation: gong-hit 0.4s; }
@keyframes gong-hit { 30% { transform: scale(0.92) rotate(-3deg); } }

/* Trắc nghiệm */
.q-progress { color: var(--muted); margin: 0; }
.q-question { font-weight: 700; font-size: 17px; }
.q-options { display: grid; gap: 8px; margin: 12px 0; }
.q-options button { text-align: left; border: 2px solid #0001; background: #fff; border-radius: 12px; padding: 12px; font: inherit; min-height: 48px; cursor: pointer; }
.q-options button.correct { border-color: var(--ok); background: #e8f5e9; }
.q-options button.wrong { border-color: var(--bad); background: #ffebee; }
.q-feedback.ok { color: var(--ok); }
.q-feedback.bad { color: var(--bad); }
.q-score { font-size: 22px; font-weight: 700; text-align: center; margin: 20px 0; }

/* Góc chụp ảnh */
.booth-choices { display: flex; gap: 8px; overflow-x: auto; }
.booth-choices button { border: 3px solid transparent; border-radius: 10px; padding: 0; background: none; width: 72px; flex-shrink: 0; cursor: pointer; }
.booth-choices button[aria-pressed="true"] { border-color: var(--accent); }
.booth-choices img { width: 100%; border-radius: 7px; display: block; }
.booth-stage { position: relative; aspect-ratio: 3 / 4; background: #222; border-radius: 12px; overflow: hidden; margin: 10px 0; touch-action: none; }
.booth-stage video, .booth-stage canvas, .booth-stage .booth-overlay { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.booth-stage video.mirror { transform: scaleX(-1); }
.booth-stage .booth-overlay, .booth-guide { pointer-events: none; }
.booth-guide { position: absolute; left: 50%; top: 12%; width: 32%; aspect-ratio: 3 / 4; transform: translateX(-50%); border: 2px dashed #fff8; border-radius: 50%; }
.booth-actions { display: flex; flex-wrap: wrap; gap: 8px; margin: 8px 0; }
.booth-zoom { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.booth-zoom input { flex: 1; }
.booth-result img { width: 100%; border-radius: 12px; display: block; }

.toast {
  position: fixed; top: 64px; left: 50%; transform: translateX(-50%); z-index: 30;
  background: #000c; color: #fff; padding: 8px 16px; border-radius: 999px; font-size: 15px;
  animation: toast 1.6s forwards; pointer-events: none;
}
@keyframes toast { 0% { opacity: 0; } 10%, 80% { opacity: 1; } 100% { opacity: 0; } }
```

- [ ] **Step 9: Typecheck**

Run: `npm run typecheck`
Expected: không có lỗi.

- [ ] **Step 10: Commit**

```bash
git add src/ui
git commit -m "feat: add UI shell (panel, top bar, room bar, intro, narration)" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Hiện vật 3D, biển tên gian, vòng tròn điểm đứng

**Files:**
- Create: `src/exhibits/build.ts`, `src/exhibits/signs.ts`, `src/exhibits/markers.ts`

- [ ] **Step 1: Viết `src/exhibits/build.ts`**

```ts
import * as THREE from 'three';
import type { Exhibit, ExhibitOf, Room } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import type { HitData } from '../nav/picker';
import { makeLabel, type Label, type LabelOptions } from '../scene/label';
import { exhibitAnchor, type Anchor } from '../scene/layout';
import type { LazyImages } from '../scene/textures';
import { excerpt } from '../util/text';

export interface BuiltExhibit {
  key: string;
  room: Room;
  exhibit: Exhibit;
  object: THREE.Group;
  hitTargets: THREE.Object3D[];
  anchor: Anchor;
  relang(): void;
  update(dt: number, time: number): void;
  setActive(active: boolean): void;
  swing(index: number): void;
}

interface Extra {
  update?(dt: number, time: number): void;
  swing?(index: number): void;
}

type AddLabel = (text: () => string, opts: LabelOptions, x: number, y: number, z?: number) => Label;

const woodMat = new THREE.MeshLambertMaterial({ color: '#6b4a2b' });
const brassMat = new THREE.MeshStandardMaterial({ color: '#b8893a', metalness: 0.4, roughness: 0.45 });
const PAPER = '#f3e6cc';
const INK = '#3b2a1a';

function frame(group: THREE.Group, w: number, h: number, cy: number): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.05), woodMat);
  mesh.position.set(0, cy, 0.03);
  group.add(mesh);
}

function imagePlane(group: THREE.Group, images: LazyImages, roomOrder: number, url: string, w: number, h: number, x: number, y: number): void {
  const material = new THREE.MeshBasicMaterial({ color: '#d8c7a8' });
  images.add(roomOrder, url, material);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, 0.06);
  group.add(mesh);
}

export function exhibitKey(room: Room, ex: Exhibit): string {
  return `${room.slug}/${ex.id}`;
}

export function buildExhibit(room: Room, ex: Exhibit, images: LazyImages): BuiltExhibit {
  const key = exhibitKey(room, ex);
  const anchor = exhibitAnchor(room.order, ex.position.wall, ex.position.slot);
  const group = new THREE.Group();
  group.position.set(anchor.x, 0, anchor.z);
  group.rotation.y = anchor.facing;

  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.3), glowMat);
  glow.position.set(0, 1.65, 0.005);
  group.add(glow);

  const labels: Array<{ label: Label; text: () => string }> = [];
  const addLabel: AddLabel = (text, opts, x, y, z = 0.06) => {
    const label = makeLabel(text(), opts);
    label.mesh.position.set(x, y, z);
    group.add(label.mesh);
    labels.push({ label, text });
    return label;
  };

  const extra = buildByType(ex, room, group, images, addLabel, key);

  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== glow && !obj.userData.hit) {
      obj.userData.hit = { kind: 'exhibit', exhibitKey: key } satisfies HitData;
    }
  });
  const hitTargets: THREE.Object3D[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== glow) hitTargets.push(obj);
  });

  let active = false;
  return {
    key,
    room,
    exhibit: ex,
    object: group,
    hitTargets,
    anchor,
    relang: () => labels.forEach((l) => l.label.setText(l.text())),
    update: (dt, time) => {
      glowMat.opacity = active ? 0.2 + 0.12 * Math.sin(time * 3) : 0;
      extra.update?.(dt, time);
    },
    setActive: (value) => {
      active = value;
    },
    swing: (index) => extra.swing?.(index),
  };
}

function buildByType(ex: Exhibit, room: Room, group: THREE.Group, images: LazyImages, addLabel: AddLabel, key: string): Extra {
  switch (ex.type) {
    case 'board':
      frame(group, 2.0, 1.4, 1.6);
      addLabel(
        () => `${t(ex.title)}\n${excerpt(t(ex.body), 150)}\n\n▶ ${t(UI.tapToView)}`,
        { width: 2.0, height: 1.4, bg: PAPER, fg: INK, fontPx: 34, align: 'left', heading: true },
        0,
        1.6,
      );
      return {};

    case 'gallery':
      ex.images.slice(0, 3).forEach((img, i) => {
        const x = (i - 1) * 0.9;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.66, 0.05), woodMat);
        m.position.set(x, 1.75, 0.03);
        group.add(m);
        imagePlane(group, images, room.order, img.src, 0.78, 0.58, x, 1.75);
      });
      addLabel(() => t(ex.title), { width: 2.6, height: 0.3, bg: INK, fg: PAPER, fontPx: 36 }, 0, 1.22);
      return {};

    case 'video':
      frame(group, 2.0, 1.125, 1.7);
      addLabel(() => t(ex.title), { width: 2.0, height: 1.125, bg: '#111111', fg: '#ffffff', fontPx: 36, variant: 'screen' }, 0, 1.7);
      return {};

    case 'gongs':
      return buildGongs(ex, room, group, images, addLabel, key);

    case 'ar': {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), woodMat);
      pedestal.position.set(0, 0.5, 0.8);
      group.add(pedestal);
      const geo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 40);
      geo.rotateX(Math.PI / 2);
      const preview = new THREE.Mesh(geo, brassMat);
      preview.position.set(0, 1.35, 0.8);
      group.add(preview);
      addLabel(() => `AR · ${t(ex.title)}`, { width: 1.8, height: 0.45, bg: INK, fg: PAPER, fontPx: 40 }, 0, 2.3);
      return {
        update: (_dt, time) => {
          preview.rotation.y = time * 0.8;
        },
      };
    }

    case 'costume': {
      frame(group, 1.1, 1.47, 1.45);
      imagePlane(group, images, room.order, ex.costumes[0].thumb, 1.1, 1.47, 0, 1.45);
      addLabel(() => `${t(UI.photoCorner)} · ${t(ex.title)}`, { width: 2.2, height: 0.4, bg: '#e2572b', fg: '#ffffff', fontPx: 40 }, 0, 2.45);
      return {};
    }

    case 'quiz':
      frame(group, 2.4, 1.6, 1.6);
      addLabel(
        () => `?\n${t(ex.title)}\n${t(UI.tapToStart)}`,
        { width: 2.4, height: 1.6, bg: '#e2572b', fg: '#ffffff', fontPx: 48, heading: true },
        0,
        1.6,
      );
      return {};
  }
}

function buildGongs(ex: ExhibitOf<'gongs'>, room: Room, group: THREE.Group, images: LazyImages, addLabel: AddLabel, key: string): Extra {
  const RACK_Z = 0.5;
  for (const x of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.25, 0.08), woodMat);
    post.position.set(x, 1.125, RACK_Z);
    group.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.08), woodMat);
  bar.position.set(0, 2.2, RACK_Z);
  group.add(bar);
  addLabel(() => `${t(ex.title)} · ${t(UI.tapGong)}`, { width: 2.8, height: 0.32, bg: INK, fg: PAPER, fontPx: 34 }, 0, 2.5, RACK_Z);

  const gongGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.05, 40);
  gongGeo.rotateX(Math.PI / 2);
  const cordGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6);

  const pivots = ex.gongs.map((g, i) => {
    const face = new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.2, roughness: 0.5 });
    images.add(room.order, g.image, face);
    const pivot = new THREE.Group();
    pivot.position.set(-1.25 + i * 0.5, 2.16, RACK_Z);
    const cord = new THREE.Mesh(cordGeo, brassMat);
    cord.position.y = -0.18;
    const gong = new THREE.Mesh(gongGeo, [brassMat, face, brassMat]);
    gong.position.y = -0.57;
    gong.userData.hit = { kind: 'gong', exhibitKey: key, index: i } satisfies HitData;
    pivot.add(cord, gong);
    group.add(pivot);
    return pivot;
  });

  const amplitudes = pivots.map(() => 0);
  return {
    update: (dt, time) => {
      pivots.forEach((pivot, i) => {
        amplitudes[i] *= Math.exp(-dt * 2.2);
        pivot.rotation.x = amplitudes[i] * Math.sin(time * 8 + i);
      });
    },
    swing: (index) => {
      amplitudes[index] = 0.22;
    },
  };
}
```

- [ ] **Step 2: Viết `src/exhibits/signs.ts`**

```ts
import type * as THREE from 'three';
import type { Room, Site } from '../content/schema';
import { t } from '../i18n/lang';
import { makeLabel, type Label, type LabelOptions } from '../scene/label';
import { HALF_WIDTH, roomStartX } from '../scene/layout';

const DARK: Pick<LabelOptions, 'bg' | 'fg'> = { bg: '#3b2a1a', fg: '#f3e6cc' };

export function buildSigns(scene: THREE.Scene, site: Site, rooms: Room[]): { relang(): void } {
  const bindings: Array<{ label: Label; text: () => string }> = [];
  const add = (text: () => string, opts: LabelOptions, x: number, y: number, z: number, rotationY: number) => {
    const label = makeLabel(text(), opts);
    label.mesh.position.set(x, y, z);
    label.mesh.rotation.y = rotationY;
    scene.add(label.mesh);
    bindings.push({ label, text });
  };

  // Biển trên cửa, nhìn ra sân (−x)
  add(() => t(site.name), { width: 4.2, height: 0.6, fontPx: 52, ...DARK }, -0.1, 2.8, 0, -Math.PI / 2);

  // Lời chào trên vách trái của sảnh
  add(
    () => `${t(site.name)}\n${t(site.welcome)}`,
    { width: 3.4, height: 1.9, bg: '#f3e6cc', fg: '#3b2a1a', fontPx: 34, align: 'left', heading: true },
    3,
    1.7,
    -HALF_WIDTH + 0.1,
    0,
  );

  // Tên gian treo dưới xà, quay về phía khách đi tới (−x)
  for (const room of rooms) {
    add(() => `${room.order}. ${t(room.name)}`, { width: 3.4, height: 0.5, fontPx: 44, ...DARK }, roomStartX(room.order) + 0.2, 2.7, 0, -Math.PI / 2);
  }

  return { relang: () => bindings.forEach((b) => b.label.setText(b.text())) };
}
```

- [ ] **Step 3: Viết `src/exhibits/markers.ts`**

```ts
import * as THREE from 'three';
import type { HitData } from '../nav/picker';
import { standpoints } from '../scene/layout';

export function buildMarkers(scene: THREE.Scene): { targets: THREE.Object3D[]; update(time: number, camX: number, camZ: number): void } {
  const ringGeo = new THREE.RingGeometry(0.32, 0.42, 40);
  const hitGeo = new THREE.CircleGeometry(0.7, 24);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  const items = standpoints().map((sp) => {
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false });
    const ring = new THREE.Mesh(ringGeo, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sp.x, 0.03, sp.z);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.rotation.x = -Math.PI / 2;
    hit.position.set(sp.x, 0.02, sp.z);
    const data: HitData = { kind: 'standpoint', x: sp.x, z: sp.z };
    ring.userData.hit = data;
    hit.userData.hit = data;
    scene.add(ring, hit);
    return { sp, material, ring, hit };
  });

  return {
    targets: items.flatMap((i) => [i.ring, i.hit]),
    update(time, camX, camZ) {
      for (const item of items) {
        const here = Math.hypot(item.sp.x - camX, item.sp.z - camZ) < 0.6;
        item.material.opacity = here ? 0 : 0.55 + 0.25 * Math.sin(time * 2.5);
      }
    },
  };
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: không có lỗi.

- [ ] **Step 5: Commit**

```bash
git add src/exhibits
git commit -m "feat: add 3D exhibits, room signs and standpoint markers" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Âm thanh và nội dung khung thông tin: bảng, ảnh, video, AR, chiêng

**Files:**
- Create: `src/features/types.ts`, `src/features/sound.ts`, `src/features/board.ts`, `src/features/gallery.ts`, `src/features/video.ts`, `src/features/ar.ts`, `src/features/gongs.ts`

- [ ] **Step 1: Viết `src/features/types.ts`**

```ts
import type { SoundPlayer } from './sound';

export interface PanelCtx {
  player: SoundPlayer;
  /** Gọi khi khách bấm chiêng thứ `index` trong khung, để chiêng 3D rung theo. */
  onGong(index: number): void;
}
```

- [ ] **Step 2: Viết `src/features/sound.ts`**

```ts
type AudioContextCtor = typeof AudioContext;

/** Phát âm thanh ngắn (chiêng, đúng/sai) không trễ bằng Web Audio. */
export class SoundPlayer {
  private ctx: AudioContext | null = null;
  private loading = new Map<string, Promise<AudioBuffer | null>>();

  /** Gọi trong sự kiện chạm/bấm của người dùng (chính sách tự phát của trình duyệt). */
  unlock(): void {
    if (!this.ctx) {
      const Ctor: AudioContextCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  preload(urls: string[]): void {
    urls.forEach((url) => void this.load(url));
  }

  async play(url: string): Promise<boolean> {
    this.unlock();
    const ctx = this.ctx;
    if (!ctx) return false;
    const buffer = await this.load(url);
    if (!buffer) return false;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
    return true;
  }

  private load(url: string): Promise<AudioBuffer | null> {
    const ctx = this.ctx;
    if (!ctx) return Promise.resolve(null);
    let promise = this.loading.get(url);
    if (!promise) {
      promise = fetch(url)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.arrayBuffer();
        })
        .then((data) => ctx.decodeAudioData(data))
        .catch((err: unknown) => {
          console.warn(`Không tải được âm thanh ${url}`, err);
          return null;
        });
      this.loading.set(url, promise);
    }
    return promise;
  }
}
```

- [ ] **Step 3: Viết `src/features/board.ts`**

```ts
import type { ExhibitOf } from '../content/schema';
import { pickAudio, t } from '../i18n/lang';
import { h, paragraphs } from '../ui/dom';
import { narrationButton } from '../ui/narration';
import type { PanelContent } from '../ui/panel';

export function renderBoard(ex: ExhibitOf<'board'>): PanelContent {
  const narration = narrationButton(() => pickAudio(ex.narration));
  const text = h('div', { class: 'p-text' });
  const update = () => {
    text.replaceChildren(...paragraphs(t(ex.body)));
    narration.update();
  };
  update();
  return { el: h('div', { class: 'p-board' }, narration.el, text), update, dispose: narration.dispose };
}
```

- [ ] **Step 4: Viết `src/features/gallery.ts`**

```ts
import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

let zoomEl: HTMLElement | null = null;

function closeZoom(): void {
  zoomEl?.remove();
  zoomEl = null;
}

function openZoom(src: string, alt: string): void {
  closeZoom();
  zoomEl = h('div', { class: 'zoom', role: 'dialog', 'aria-label': alt }, h('img', { src, alt }));
  zoomEl.addEventListener('click', closeZoom);
  document.body.append(zoomEl);
}

export function renderGallery(ex: ExhibitOf<'gallery'>): PanelContent {
  const el = h('div', { class: 'p-gallery' });
  const update = () => {
    el.replaceChildren(
      ...ex.images.map((img) => {
        const pic = h('img', { src: img.src, alt: t(img.alt), loading: 'lazy' });
        pic.addEventListener('error', () => pic.replaceWith(h('div', { class: 'media-missing' }, `${t(UI.mediaError)}: ${t(img.alt)}`)));
        pic.addEventListener('click', () => openZoom(img.src, t(img.alt)));
        return h('figure', {}, pic, img.caption ? h('figcaption', {}, t(img.caption)) : null);
      }),
    );
  };
  update();
  return { el, update, dispose: closeZoom };
}
```

- [ ] **Step 5: Viết `src/features/video.ts`**

```ts
import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

export function renderVideo(ex: ExhibitOf<'video'>): PanelContent {
  // Chỉ tạo iframe khi khung mở; gỡ iframe khi đóng để dừng phát.
  const frame = h('iframe', {
    src: `https://www.youtube-nocookie.com/embed/${ex.youtubeId}?rel=0&playsinline=1`,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    allowfullscreen: '',
    referrerpolicy: 'strict-origin-when-cross-origin',
  });
  const update = () => frame.setAttribute('title', t(ex.title));
  update();
  return { el: h('div', { class: 'p-video' }, frame), update, dispose: () => frame.remove() };
}
```

- [ ] **Step 6: Viết `src/features/ar.ts`**

```ts
import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h, paragraphs } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

const MODEL_VIEWER_URL = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
let loader: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (customElements.get('model-viewer')) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Không tải được model-viewer'));
    };
    document.head.append(script);
  });
  return loader;
}

type NoteKey = 'arUnsupported' | 'mediaError' | 'viewerError';

export function renderAr(ex: ExhibitOf<'ar'>): PanelContent {
  let noteKey: NoteKey | null = null;
  const note = h('p', { class: 'note', role: 'status' });
  const text = h('div', { class: 'p-text' });
  const viewer = document.createElement('model-viewer');
  const attrs: Record<string, string> = {
    src: ex.glb,
    ar: '',
    'ar-modes': 'webxr scene-viewer quick-look',
    'camera-controls': '',
    'auto-rotate': '',
    'shadow-intensity': '1',
  };
  if (ex.usdz) attrs['ios-src'] = ex.usdz;
  if (ex.poster) attrs.poster = ex.poster;
  for (const [k, v] of Object.entries(attrs)) viewer.setAttribute(k, v);
  const arButton = h('button', { type: 'button', slot: 'ar-button', class: 'btn ar-btn' });
  viewer.append(arButton);

  const setNote = (key: NoteKey | null) => {
    noteKey = key;
    note.textContent = key ? t(UI[key]) : '';
  };
  viewer.addEventListener('load', () => {
    const canAr = (viewer as HTMLElement & { canActivateAR?: boolean }).canActivateAR;
    setNote(canAr ? null : 'arUnsupported');
  });
  viewer.addEventListener('error', () => setNote('mediaError'));
  loadModelViewer().catch(() => setNote('viewerError'));

  const update = () => {
    arButton.textContent = t(UI.viewAr);
    viewer.setAttribute('alt', t(ex.title));
    text.replaceChildren(...paragraphs(t(ex.body)));
    setNote(noteKey);
  };
  update();
  return { el: h('div', { class: 'p-ar' }, viewer, note, text), update, dispose: () => viewer.remove() };
}
```

- [ ] **Step 7: Viết `src/features/gongs.ts`**

```ts
import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';
import type { PanelCtx } from './types';

export function renderGongs(ex: ExhibitOf<'gongs'>, ctx: PanelCtx): PanelContent {
  ctx.player.unlock();
  ctx.player.preload(ex.gongs.map((g) => g.sound));
  const grid = h('div', { class: 'p-gongs' });
  const update = () => {
    grid.replaceChildren(
      ...ex.gongs.map((g, i) => {
        const button = h('button', { type: 'button' }, h('img', { src: g.image, alt: '' }), h('span', {}, t(g.name)));
        button.addEventListener('click', () => {
          button.classList.remove('hit');
          void button.offsetWidth; // chạy lại hiệu ứng rung
          button.classList.add('hit');
          ctx.onGong(i);
          void ctx.player.play(g.sound).then((ok) => {
            if (!ok) {
              button.disabled = true;
              button.title = t(UI.audioError);
            }
          });
        });
        return button;
      }),
    );
  };
  update();
  return { el: grid, update, dispose: () => undefined };
}
```

- [ ] **Step 8: Typecheck**

Run: `npm run typecheck`
Expected: không có lỗi.

- [ ] **Step 9: Commit**

```bash
git add src/features
git commit -m "feat: add panel content for boards, galleries, videos, AR and gongs" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 13: Trắc nghiệm

**Files:**
- Create: `src/features/quiz/logic.ts`, `src/features/quiz/panel.ts`
- Test: `tests/unit/quiz.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { answerQuiz, isFinished, nextQuestion, startQuiz } from '../../src/features/quiz/logic';

describe('quiz logic', () => {
  it('bắt đầu ở câu 0, chưa chọn, 0 điểm', () => {
    expect(startQuiz(3)).toEqual({ index: 0, score: 0, picked: null, total: 3 });
  });

  it('chọn đúng cộng điểm, chọn sai không cộng', () => {
    const right = answerQuiz(startQuiz(2), 1, 1);
    expect(right.correct).toBe(true);
    expect(right.state.score).toBe(1);
    const wrong = answerQuiz(startQuiz(2), 0, 1);
    expect(wrong.correct).toBe(false);
    expect(wrong.state.score).toBe(0);
    expect(wrong.state.picked).toBe(0);
  });

  it('không cho chọn lại trong cùng một câu', () => {
    const first = answerQuiz(startQuiz(2), 0, 1);
    const again = answerQuiz(first.state, 1, 1);
    expect(again.state).toBe(first.state);
    expect(again.state.score).toBe(0);
  });

  it('qua câu tiếp và kết thúc sau câu cuối', () => {
    let s = startQuiz(2);
    s = nextQuestion(answerQuiz(s, 0, 0).state);
    expect(s).toEqual({ index: 1, score: 1, picked: null, total: 2 });
    expect(isFinished(s)).toBe(false);
    s = nextQuestion(answerQuiz(s, 2, 3).state);
    expect(isFinished(s)).toBe(true);
    expect(s.score).toBe(1);
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/quiz.test.ts`
Expected: FAIL, không tìm thấy module `src/features/quiz/logic`.

- [ ] **Step 3: Viết `src/features/quiz/logic.ts`**

```ts
export interface QuizState {
  index: number;
  score: number;
  picked: number | null;
  total: number;
}

export function startQuiz(total: number): QuizState {
  return { index: 0, score: 0, picked: null, total };
}

export function answerQuiz(state: QuizState, choice: number, answer: number): { state: QuizState; correct: boolean } {
  if (state.picked !== null) return { state, correct: state.picked === answer };
  const correct = choice === answer;
  return { state: { ...state, picked: choice, score: state.score + (correct ? 1 : 0) }, correct };
}

export function nextQuestion(state: QuizState): QuizState {
  return { ...state, index: state.index + 1, picked: null };
}

export function isFinished(state: QuizState): boolean {
  return state.index >= state.total;
}
```

- [ ] **Step 4: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/quiz.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Viết `src/features/quiz/panel.ts`**

```ts
import type { ExhibitOf } from '../../content/schema';
import { t } from '../../i18n/lang';
import { UI } from '../../i18n/ui-strings';
import { h } from '../../ui/dom';
import type { PanelContent } from '../../ui/panel';
import type { PanelCtx } from '../types';
import { answerQuiz, isFinished, nextQuestion, startQuiz } from './logic';

const SOUND_RIGHT = '/media/ui/dung.wav';
const SOUND_WRONG = '/media/ui/sai.wav';

export function renderQuiz(ex: ExhibitOf<'quiz'>, ctx: PanelCtx): PanelContent {
  ctx.player.unlock();
  ctx.player.preload([SOUND_RIGHT, SOUND_WRONG]);
  let state = startQuiz(ex.questions.length);
  const el = h('div', { class: 'p-quiz' });

  const render = () => {
    if (isFinished(state)) {
      const retry = h('button', { type: 'button', class: 'btn' }, t(UI.quizRetry));
      retry.addEventListener('click', () => {
        state = startQuiz(ex.questions.length);
        render();
      });
      const score = t(UI.quizScore).replace('{score}', String(state.score)).replace('{total}', String(state.total));
      el.replaceChildren(h('p', { class: 'q-score', role: 'status' }, score), retry);
      return;
    }

    const q = ex.questions[state.index];
    const options = h('div', { class: 'q-options' });
    q.options.forEach((option, i) => {
      const button = h('button', { type: 'button' }, t(option));
      if (state.picked !== null) {
        button.disabled = true;
        if (i === q.answer) button.classList.add('correct');
        else if (i === state.picked) button.classList.add('wrong');
      }
      button.addEventListener('click', () => {
        const result = answerQuiz(state, i, q.answer);
        state = result.state;
        void ctx.player.play(result.correct ? SOUND_RIGHT : SOUND_WRONG);
        render();
      });
      options.append(button);
    });

    const parts: Node[] = [
      h('p', { class: 'q-progress' }, `${t(UI.quizQuestion)} ${state.index + 1}/${state.total}`),
      h('p', { class: 'q-question' }, t(q.question)),
      options,
    ];
    if (state.picked !== null) {
      const correct = state.picked === q.answer;
      parts.push(h('p', { class: `q-feedback ${correct ? 'ok' : 'bad'}`, role: 'status' }, `${t(correct ? UI.quizCorrect : UI.quizWrong)} ${t(q.explain)}`));
      const next = h('button', { type: 'button', class: 'btn' }, t(UI.quizNext));
      next.addEventListener('click', () => {
        state = nextQuestion(state);
        render();
      });
      parts.push(next);
    }
    el.replaceChildren(...parts);
  };

  render();
  return { el, update: render, dispose: () => undefined };
}
```

- [ ] **Step 6: Typecheck và commit**

Run: `npm run typecheck`
Expected: không có lỗi.

```bash
git add src/features/quiz tests/unit/quiz.test.ts
git commit -m "feat: add quiz with right/wrong sounds and score" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 14: Góc chụp ảnh mặc trang phục

**Files:**
- Create: `src/features/costume/geometry.ts`, `src/features/costume/booth.ts`
- Test: `tests/unit/costume.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { coverRect, placedRect } from '../../src/features/costume/geometry';

describe('coverRect', () => {
  it('ảnh ngang: cắt hai bên', () => {
    expect(coverRect(1280, 960, 1080, 1440)).toEqual({ sx: 280, sy: 0, sw: 720, sh: 960 });
  });
  it('ảnh dọc cao hơn khung: cắt trên dưới', () => {
    expect(coverRect(720, 1280, 1080, 1440)).toEqual({ sx: 0, sy: 160, sw: 720, sh: 960 });
  });
});

describe('placedRect', () => {
  it('zoom 1 phủ kín khung, căn giữa', () => {
    expect(placedRect(1000, 1000, 1080, 1440, 1, 0, 0)).toEqual({ dx: -180, dy: 0, dw: 1440, dh: 1440 });
  });
  it('zoom 2 và dịch ảnh', () => {
    expect(placedRect(1000, 1000, 1080, 1440, 2, 100, -50)).toEqual({ dx: -800, dy: -770, dw: 2880, dh: 2880 });
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/costume.test.ts`
Expected: FAIL, không tìm thấy module `src/features/costume/geometry`.

- [ ] **Step 3: Viết `src/features/costume/geometry.ts`**

```ts
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

/** Vị trí vẽ ảnh khách tải lên: phủ kín khung × zoom, dịch theo offX/offY (pixel khung đích). */
export function placedRect(imgW: number, imgH: number, dstW: number, dstH: number, zoom: number, offX: number, offY: number): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.max(dstW / imgW, dstH / imgH) * zoom;
  const dw = imgW * scale;
  const dh = imgH * scale;
  return { dx: (dstW - dw) / 2 + offX, dy: (dstH - dh) / 2 + offY, dw, dh };
}
```

- [ ] **Step 4: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/costume.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Viết `src/features/costume/booth.ts`**

```ts
import type { ExhibitOf } from '../../content/schema';
import { t } from '../../i18n/lang';
import { UI } from '../../i18n/ui-strings';
import { h } from '../../ui/dom';
import type { PanelContent } from '../../ui/panel';
import { coverRect, placedRect } from './geometry';

const OUT_W = 1080;
const OUT_H = 1440;
const FRAME_BAR = 120;
const FILE_NAME = 'trien-lam-mnong.jpg';

type Mode = 'idle' | 'camera' | 'upload' | 'result';

export function renderCostume(ex: ExhibitOf<'costume'>): PanelContent {
  let costumeIndex = 0;
  let mode: Mode = 'idle';
  let facing: 'user' | 'environment' = 'user';
  let stream: MediaStream | null = null;
  let uploaded: HTMLImageElement | null = null;
  let uploadUrl: string | null = null;
  let resultUrl: string | null = null;
  let lastBlob: Blob | null = null;
  let messageKey: 'boothNoCamera' | 'mediaError' | null = null;
  let zoom = 1;
  let offX = 0;
  let offY = 0;

  const relabels: Array<() => void> = [];
  const button = (label: () => string, cls: string, onClick: () => void) => {
    const b = h('button', { type: 'button', class: cls });
    b.addEventListener('click', onClick);
    const set = () => {
      b.textContent = label();
    };
    set();
    relabels.push(set);
    return b;
  };

  const choices = h('div', { class: 'booth-choices', role: 'group' });
  const video = h('video', { playsinline: '', muted: '', autoplay: '' });
  video.muted = true;
  const preview = h('canvas', { width: String(OUT_W), height: String(OUT_H) });
  const overlay = h('img', { class: 'booth-overlay', alt: '' });
  const stageBox = h('div', { class: 'booth-stage' }, video, preview, overlay, h('div', { class: 'booth-guide' }));
  const message = h('p', { class: 'note', role: 'status' });
  const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: '' });
  const zoomInput = h('input', { type: 'range', min: '1', max: '3', step: '0.01', value: '1' });
  const zoomText = h('span', {});
  const zoomLabel = h('label', { class: 'booth-zoom' }, zoomText, zoomInput);
  const result = h('div', { class: 'booth-result' });
  const privacy = h('p', { class: 'note' });

  const cameraBtn = button(() => t(UI.boothCamera), 'btn', () => void startCamera());
  const switchBtn = button(() => t(UI.boothSwitch), 'btn secondary', () => {
    facing = facing === 'user' ? 'environment' : 'user';
    void startCamera();
  });
  const shootBtn = button(() => t(UI.boothShoot), 'btn', () => void capture());
  const uploadBtn = button(() => t(UI.boothUpload), 'btn secondary', () => fileInput.click());
  const retakeBtn = button(() => t(UI.boothRetake), 'btn secondary', () => setMode(stream ? 'camera' : uploaded ? 'upload' : 'idle'));
  const actions = h('div', { class: 'booth-actions' }, cameraBtn, switchBtn, shootBtn, uploadBtn);

  function setMode(next: Mode): void {
    mode = next;
    video.hidden = mode !== 'camera';
    preview.hidden = mode !== 'upload';
    stageBox.hidden = mode === 'result';
    actions.hidden = mode === 'result';
    result.hidden = mode !== 'result';
    switchBtn.hidden = mode !== 'camera';
    shootBtn.hidden = mode !== 'camera' && mode !== 'upload';
    cameraBtn.hidden = mode === 'camera';
    zoomLabel.hidden = mode !== 'upload';
  }

  function setMessage(key: typeof messageKey): void {
    messageKey = key;
    message.textContent = key ? t(UI[key]) : '';
  }

  function renderChoices(): void {
    choices.replaceChildren(
      ...ex.costumes.map((c, i) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(i === costumeIndex), title: t(c.name) }, h('img', { src: c.thumb, alt: t(c.name) }));
        b.addEventListener('click', () => {
          costumeIndex = i;
          overlay.src = c.overlay;
          renderChoices();
        });
        return b;
      }),
    );
  }

  function stopStream(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  }

  async function startCamera(): Promise<void> {
    stopStream();
    if (!navigator.mediaDevices?.getUserMedia) {
      showNoCamera();
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      video.srcObject = stream;
      video.classList.toggle('mirror', facing === 'user');
      await video.play().catch(() => undefined);
      setMessage(null);
      setMode('camera');
    } catch {
      showNoCamera();
    }
  }

  function showNoCamera(): void {
    setMessage('boothNoCamera');
    setMode(uploaded ? 'upload' : 'idle');
    uploadBtn.classList.add('pulse');
  }

  function drawPreview(): void {
    const ctx = preview.getContext('2d');
    if (!ctx || !uploaded) return;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    const r = placedRect(uploaded.naturalWidth, uploaded.naturalHeight, OUT_W, OUT_H, zoom, offX, offY);
    ctx.drawImage(uploaded, r.dx, r.dy, r.dw, r.dh);
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    stopStream();
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    uploadUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      uploaded = img;
      zoom = 1;
      offX = 0;
      offY = 0;
      zoomInput.value = '1';
      setMessage(null);
      setMode('upload');
      drawPreview();
    };
    img.onerror = () => setMessage('mediaError');
    img.src = uploadUrl;
  });

  zoomInput.addEventListener('input', () => {
    zoom = Number(zoomInput.value);
    drawPreview();
  });

  let drag: { x: number; y: number } | null = null;
  preview.addEventListener('pointerdown', (e) => {
    drag = { x: e.clientX, y: e.clientY };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const scale = OUT_W / (preview.clientWidth || OUT_W);
    offX += (e.clientX - drag.x) * scale;
    offY += (e.clientY - drag.y) * scale;
    drag = { x: e.clientX, y: e.clientY };
    drawPreview();
  });
  preview.addEventListener('pointerup', () => {
    drag = null;
  });

  function drawFrame(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#c79a63';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, OUT_W - 24, OUT_H - 24);
    ctx.fillStyle = '#3b2a1a';
    ctx.fillRect(0, OUT_H - FRAME_BAR, OUT_W, FRAME_BAR);
    ctx.fillStyle = '#f3e6cc';
    ctx.font = '600 44px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t(UI.boothFrame), OUT_W / 2, OUT_H - FRAME_BAR / 2);
  }

  async function capture(): Promise<void> {
    const out = document.createElement('canvas');
    out.width = OUT_W;
    out.height = OUT_H;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    if (mode === 'camera' && video.videoWidth) {
      const r = coverRect(video.videoWidth, video.videoHeight, OUT_W, OUT_H);
      ctx.save();
      if (facing === 'user') {
        ctx.translate(OUT_W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, r.sx, r.sy, r.sw, r.sh, 0, 0, OUT_W, OUT_H);
      ctx.restore();
    } else if (mode === 'upload' && uploaded) {
      ctx.drawImage(preview, 0, 0);
    } else {
      return;
    }
    if (overlay.complete && overlay.naturalWidth) ctx.drawImage(overlay, 0, 0, OUT_W, OUT_H);
    drawFrame(ctx);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob) return;
    lastBlob = blob;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    renderResult();
    setMode('result');
  }

  function renderResult(): void {
    if (!lastBlob || !resultUrl) return;
    const blob = lastBlob;
    const row = h('div', { class: 'booth-actions' }, h('a', { class: 'btn', href: resultUrl, download: FILE_NAME }, t(UI.boothDownload)), retakeBtn);
    const file = new File([blob], FILE_NAME, { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      const share = h('button', { type: 'button', class: 'btn secondary' }, t(UI.boothShare));
      share.addEventListener('click', () => {
        navigator.share({ files: [file], title: t(UI.boothFrame) }).catch(() => undefined);
      });
      row.append(share);
    }
    result.replaceChildren(h('img', { src: resultUrl, alt: t(UI.boothFrame) }), row);
  }

  const update = () => {
    relabels.forEach((fn) => fn());
    zoomText.textContent = t(UI.boothZoom);
    privacy.textContent = t(UI.boothPrivacy);
    setMessage(messageKey);
    renderChoices();
    if (mode === 'result') renderResult();
  };

  overlay.src = ex.costumes[0].overlay;
  setMode('idle');
  update();

  return {
    el: h('div', { class: 'p-booth' }, choices, stageBox, message, actions, zoomLabel, fileInput, result, privacy),
    update,
    dispose: () => {
      stopStream();
      if (uploadUrl) URL.revokeObjectURL(uploadUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    },
  };
}
```

- [ ] **Step 6: Typecheck và commit**

Run: `npm run typecheck`
Expected: không có lỗi.

```bash
git add src/features/costume tests/unit/costume.test.ts
git commit -m "feat: add costume photo booth with camera and upload fallback" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 15: Ghép ứng dụng 3D

**Files:**
- Create: `src/features/registry.ts`, `src/app/hooks.ts`, `src/app/exhibition.ts`
- Modify: `src/main.ts` (thay toàn bộ bản tạm)

- [ ] **Step 1: Viết `src/features/registry.ts`**

```ts
import type { Exhibit } from '../content/schema';
import type { PanelContent } from '../ui/panel';
import { renderAr } from './ar';
import { renderBoard } from './board';
import { renderCostume } from './costume/booth';
import { renderGallery } from './gallery';
import { renderGongs } from './gongs';
import { renderQuiz } from './quiz/panel';
import type { PanelCtx } from './types';
import { renderVideo } from './video';

export function renderExhibit(ex: Exhibit, ctx: PanelCtx): PanelContent {
  switch (ex.type) {
    case 'board':
      return renderBoard(ex);
    case 'gallery':
      return renderGallery(ex);
    case 'video':
      return renderVideo(ex);
    case 'gongs':
      return renderGongs(ex, ctx);
    case 'ar':
      return renderAr(ex);
    case 'costume':
      return renderCostume(ex);
    case 'quiz':
      return renderQuiz(ex, ctx);
  }
}
```

- [ ] **Step 2: Viết `src/app/hooks.ts`**

```ts
export interface ExhibitionHooks {
  mode: '3d' | 'text';
  readonly roomIndex: number;
  readonly openKey: string | null;
  goTo(index: number): void;
  open(key: string): void;
}

declare global {
  interface Window {
    /** Dùng cho kiểm thử e2e và gỡ lỗi. */
    __exhibition?: ExhibitionHooks;
  }
}

export function installHooks(o: {
  mode: '3d' | 'text';
  getRoomIndex: () => number;
  getOpenKey: () => string | null;
  goTo: (index: number) => void;
  open: (key: string) => void;
}): void {
  window.__exhibition = {
    mode: o.mode,
    get roomIndex() {
      return o.getRoomIndex();
    },
    get openKey() {
      return o.getOpenKey();
    },
    goTo: o.goTo,
    open: o.open,
  };
}
```

- [ ] **Step 3: Viết `src/app/exhibition.ts`**

```ts
import * as THREE from 'three';
import type { Room, Site } from '../content/schema';
import { buildExhibit, type BuiltExhibit } from '../exhibits/build';
import { buildMarkers } from '../exhibits/markers';
import { buildSigns } from '../exhibits/signs';
import { renderExhibit } from '../features/registry';
import { SoundPlayer } from '../features/sound';
import { onLangChange, t } from '../i18n/lang';
import { attachKeys, attachPointer } from '../nav/input';
import { pickHit, type HitData } from '../nav/picker';
import { CameraRig } from '../nav/rig';
import { roomPath, type Route } from '../nav/route';
import { buildHouse } from '../scene/house';
import { FACE_FORWARD, roomIndexAt, standpoints, viewpointFor, yawToward } from '../scene/layout';
import { createStage } from '../scene/renderer';
import { LazyImages } from '../scene/textures';
import { createIntro } from '../ui/intro';
import { Panel } from '../ui/panel';
import { createRoomBar } from '../ui/roombar';
import { showToast } from '../ui/toast';
import { createTopBar } from '../ui/topbar';
import { installHooks } from './hooks';

const WALK_SPEED = 3;
const DOOR_OUTSIDE_X = -1.6;
const DOOR_INSIDE_X = 1.2;
const LOOK_YAW = 0.004;
const LOOK_PITCH = 0.003;

export function startExhibition(site: Site, rooms: Room[], route: Route, stageEl: HTMLElement, uiEl: HTMLElement): void {
  const stage = createStage(stageEl);
  const images = new LazyImages();
  const house = buildHouse(stage.scene);
  const signs = buildSigns(stage.scene, site, rooms);
  const markers = buildMarkers(stage.scene);
  const built = new Map<string, BuiltExhibit>();
  for (const room of rooms) {
    for (const ex of room.exhibits) {
      const b = buildExhibit(room, ex, images);
      stage.scene.add(b.object);
      built.set(b.key, b);
    }
  }
  const targets: THREE.Object3D[] = [
    ...house.blockers,
    house.door,
    ...markers.targets,
    ...[...built.values()].flatMap((b) => b.hitTargets),
  ];

  const points = standpoints();
  const rig = new CameraRig(stage.camera);
  const player = new SoundPlayer();
  const topbar = createTopBar(uiEl, site);
  const panel = new Panel(uiEl);
  const bar = createRoomBar(uiEl, rooms, goToIndex);
  const intro = createIntro(uiEl, site, () => goToIndex(0));

  /** Đi tới (x, z); nếu phải qua cửa thì đi qua khung cửa, không xuyên vách. */
  function travel(x: number, z: number, yaw: number, then?: () => void): void {
    intro.hide();
    const goingIn = x >= 0;
    if (goingIn === rig.inside) {
      rig.moveTo(x, z, yaw, then);
      return;
    }
    const exitX = rig.inside ? DOOR_INSIDE_X : DOOR_OUTSIDE_X;
    const enterX = rig.inside ? DOOR_OUTSIDE_X : DOOR_INSIDE_X;
    const towardDoor = yawToward({ x: exitX, z: 0 }, { x: enterX, z: 0 });
    rig.moveTo(exitX, 0, towardDoor, () => rig.moveTo(enterX, 0, towardDoor, () => rig.moveTo(x, z, yaw, then)));
  }

  function goToIndex(index: number): void {
    const sp = points.find((p) => p.roomIndex === index);
    if (sp) travel(sp.x, sp.z, FACE_FORWARD);
  }

  function openExhibit(key: string): void {
    const b = built.get(key);
    if (!b) return;
    panel.open(key, () => t(b.exhibit.title), renderExhibit(b.exhibit, { player, onGong: (i) => b.swing(i) }));
  }

  function focusExhibit(key: string, instant: boolean): void {
    const b = built.get(key);
    if (!b) return;
    const vp = viewpointFor(b.anchor);
    const yaw = yawToward(vp, b.anchor);
    if (instant) {
      intro.hide();
      rig.teleport(vp.x, vp.z, yaw);
    } else {
      travel(vp.x, vp.z, yaw);
    }
    openExhibit(key);
  }

  function handleHit(hit: HitData | null): void {
    if (!hit) return;
    switch (hit.kind) {
      case 'door':
        goToIndex(0);
        break;
      case 'standpoint':
        travel(hit.x, hit.z, rig.yaw);
        break;
      case 'exhibit':
        focusExhibit(hit.exhibitKey, false);
        break;
      case 'gong': {
        const b = built.get(hit.exhibitKey);
        if (!b || b.exhibit.type !== 'gongs') return;
        const gong = b.exhibit.gongs[hit.index];
        b.swing(hit.index);
        showToast(t(gong.name));
        void player.play(gong.sound);
        break;
      }
    }
  }

  const canvas = stage.renderer.domElement;
  attachPointer(canvas, {
    onTap: (x, y) => {
      player.unlock();
      handleHit(pickHit(stage.camera, targets, canvas, x, y));
    },
    onLook: (dx, dy) => rig.look(dx * LOOK_YAW, dy * LOOK_PITCH),
  });
  const keys = attachKeys();

  let currentIndex = Number.NaN;
  function onRoomChange(index: number): void {
    currentIndex = index;
    bar.setCurrent(index);
    images.ensure([index - 1, index, index + 1]);
    built.forEach((b) => b.setActive(b.room.order === index));
    const room = index >= 1 ? rooms[index - 1] : null;
    room?.exhibits.forEach((ex) => {
      if (ex.type === 'gongs') player.preload(ex.gongs.map((g) => g.sound));
    });
    const path = room ? roomPath(room.slug) : '/';
    if (location.pathname !== path) history.replaceState(null, '', path);
    document.title = room ? room.seo.title : site.seo.title;
  }

  onLangChange(() => {
    signs.relang();
    built.forEach((b) => b.relang());
    topbar.relang();
    bar.relang();
    intro.relang();
    panel.relang();
  });

  // Vị trí ban đầu: link hiện vật → đứng trước hiện vật; link gian → đầu gian; còn lại → sân trước.
  const startRoom = route.slug ? rooms.find((r) => r.slug === route.slug) : undefined;
  const deepKey = startRoom && route.exhibitId ? `${startRoom.slug}/${route.exhibitId}` : null;
  if (deepKey && built.has(deepKey)) {
    focusExhibit(deepKey, true);
  } else if (startRoom) {
    intro.hide();
    const sp = points.find((p) => p.roomIndex === startRoom.order);
    if (sp) rig.teleport(sp.x, sp.z, FACE_FORWARD);
  } else {
    rig.teleport(points[0].x, points[0].z, FACE_FORWARD);
  }

  const clock = new THREE.Clock();
  stage.renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;
    const axis = keys.axis();
    if (axis.forward || axis.strafe) {
      intro.hide();
      rig.walk(axis.forward * WALK_SPEED * dt, axis.strafe * WALK_SPEED * dt);
    }
    rig.update(dt);
    rig.apply();
    const index = roomIndexAt(rig.x);
    if (index !== currentIndex) onRoomChange(index);
    built.forEach((b) => b.update(dt, time));
    markers.update(time, rig.x, rig.z);
    stage.renderer.render(stage.scene, stage.camera);
  });

  installHooks({ mode: '3d', getRoomIndex: () => currentIndex, getOpenKey: () => panel.openKey, goTo: goToIndex, open: openExhibit });
  document.body.classList.add('mode-3d');
}
```

- [ ] **Step 4: Thay toàn bộ `src/main.ts`**

Chế độ 2D (`startFallback`) được thêm ở Task 16; tạm thời khi lỗi chỉ báo trong console.

```ts
import './ui/styles.css';
import { startExhibition } from './app/exhibition';
import { loadContent } from './content/load';
import { initLang, t } from './i18n/lang';
import { UI } from './i18n/ui-strings';
import { parseRoute } from './nav/route';
import { hasWebGL } from './scene/renderer';

async function boot(): Promise<void> {
  const route = parseRoute(location.pathname, location.search);
  initLang(route.lang);
  const stageEl = document.getElementById('stage')!;
  const uiEl = document.getElementById('ui')!;
  const textEl = document.getElementById('text-version')!;

  let content;
  try {
    content = await loadContent();
  } catch (err) {
    console.error(err);
    document.body.classList.add('mode-text');
    textEl.insertAdjacentHTML('afterbegin', `<p class="note">${t(UI.loadError)}</p>`);
    return;
  }

  if (hasWebGL()) {
    try {
      startExhibition(content.site, content.rooms, route, stageEl, uiEl);
      return;
    } catch (err) {
      console.error('Không khởi tạo được cảnh 3D', err);
      stageEl.replaceChildren();
      uiEl.replaceChildren();
    }
  }
  document.body.classList.add('mode-text');
}

void boot();
```

- [ ] **Step 5: Typecheck và chạy toàn bộ unit test**

Run: `npm run typecheck && npm test`
Expected: không lỗi typecheck; tất cả test PASS.

- [ ] **Step 6: Kiểm tra bằng mắt trên dev server**

Run: `npm run dev`, mở `http://localhost:5173`

Kiểm từng mục:
1. Thấy nhà dài từ sân, thẻ lời chào ở dưới, nút "Vào nhà dài". Bấm → trượt qua cửa vào sảnh, thẻ biến mất.
2. Thanh dưới: "Sảnh". Bấm "Gian sau" → tới gian 1, thanh hiện "1/7 · Văn hóa cồng chiêng", URL đổi thành `/phong/cong-chieng/`, tab trình duyệt đổi tiêu đề.
3. Vòng tròn trắng nhấp nháy trên sàn; bấm vào → trượt tới đó.
4. Hiện vật của gian đang đứng có viền vàng nhấp nháy sau lưng. Bấm bảng giới thiệu → khung thông tin mở (bên phải trên máy tính), có nút "▶ Nghe thuyết minh" phát tiếng bíp mẫu.
5. Bấm từng chiêng 3D → chiêng rung, phát tiếng, hiện tên. Mở khung bộ chiêng → 6 nút bấm được.
6. Bấm vách ảnh → 4 ảnh mẫu vuốt ngang, bấm ảnh để xem lớn. Màn hình video → video YouTube mẫu.
7. Bục AR → mô hình chiêng xoay được (cần mạng để tải model-viewer).
8. Nút "M'Nông" ở góc trên → mọi chữ trong cảnh, thanh dưới và khung đổi sang `[M'Nông] ...`. Tải lại trang → vẫn giữ M'Nông.
9. Mở `http://localhost:5173/phong/trac-nghiem/?v=cau-hoi` → đứng trước bảng câu hỏi, khung trắc nghiệm mở sẵn. Chọn đáp án → tiếng đúng/sai, màu xanh/đỏ, giải thích, "Câu tiếp"; hết 5 câu → tổng điểm, "Chơi lại".
10. Gian 6, bấm góc chụp ảnh → chọn trang phục, "Bật camera" (cho phép) → thấy mình với áo phủ lên, "Chụp ảnh" → ảnh có khung nâu, "Tải ảnh về" tải file JPG. Từ chối camera → hiện thông báo, nút "Chọn ảnh có sẵn" nhấp nháy; chọn một ảnh → kéo, phóng to được, chụp được.
11. DevTools chế độ điện thoại (Pixel 7): khung thông tin trượt từ dưới lên, vuốt tiêu đề xuống để đóng; thanh dưới vừa màn hình.

Sửa lỗi phát hiện được trước khi commit. Dừng dev server.

- [ ] **Step 7: Commit**

```bash
git add src/features/registry.ts src/app src/main.ts
git commit -m "feat: wire up 3D exhibition app" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 16: Bản chữ HTML và chế độ 2D dự phòng

**Files:**
- Create: `src/content/render-html.ts`, `src/app/fallback.ts`
- Modify: `src/main.ts`
- Test: `tests/unit/render-html.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { renderHomeText, renderRoomText } from '../../src/content/render-html';
import { L, makeRoom, makeRooms, makeSite } from './fixtures';

const count = (html: string, re: RegExp) => (html.match(re) ?? []).length;

describe('render-html', () => {
  it('trang gian có đúng một h1, mỗi hiện vật một h2, nút mở có data-open', () => {
    const rooms = makeRooms();
    const html = renderRoomText(makeSite(), rooms, rooms[0], 'vi');
    expect(count(html, /<h1>/g)).toBe(1);
    expect(html).toContain('<h1>Gian 1</h1>');
    expect(html).toContain('<h2>Giới thiệu</h2>');
    expect(html).toContain('data-open="gian-1/gioi-thieu"');
    expect(html).toContain('<p>Đoạn 1</p><p>Đoạn 2</p>');
  });

  it('chân trang dùng h2 và có link tới 7 gian', () => {
    const rooms = makeRooms();
    const html = renderHomeText(makeSite(), rooms, 'vi');
    expect(count(html, /<h1>/g)).toBe(1);
    expect(html).not.toContain('<h4');
    for (const r of rooms) expect(html).toContain(`href="/phong/${r.slug}/"`);
  });

  it('ảnh có alt, chữ được thoát HTML, theo ngôn ngữ chọn', () => {
    const room = makeRoom(1, {
      name: { vi: 'A <b>', mnong: 'B' },
      exhibits: [
        {
          id: 'anh',
          type: 'gallery',
          position: { wall: 'right', slot: 0 },
          title: L('Ảnh'),
          images: [{ src: '/media/x.jpg', alt: L('Ảnh "đẹp"') }],
        },
      ],
    });
    const vi = renderRoomText(makeSite(), [room], room, 'vi');
    expect(vi).toContain('<h1>A &lt;b&gt;</h1>');
    expect(vi).toContain('alt="Ảnh &quot;đẹp&quot;"');
    expect(renderRoomText(makeSite(), [room], room, 'mnong')).toContain('<h1>B</h1>');
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/render-html.test.ts`
Expected: FAIL, không tìm thấy module `src/content/render-html`.

- [ ] **Step 3: Viết `src/content/render-html.ts`**

```ts
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { roomPath } from '../nav/route';
import { esc } from './escape';
import type { Exhibit, Lang, Room, Site } from './schema';

function paras(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p)}</p>`)
    .join('');
}

function exhibitBody(ex: Exhibit, lang: Lang): string {
  switch (ex.type) {
    case 'board':
      return paras(t(ex.body, lang));
    case 'gallery':
      return ex.images
        .map((img) => `<figure><img src="${esc(img.src)}" alt="${esc(t(img.alt, lang))}" loading="lazy" />${img.caption ? `<figcaption>${esc(t(img.caption, lang))}</figcaption>` : ''}</figure>`)
        .join('');
    case 'video':
      return `<p><a href="https://www.youtube.com/watch?v=${esc(ex.youtubeId)}" rel="noopener" target="_blank">${esc(t(ex.title, lang))} (YouTube)</a></p>`;
    case 'gongs':
      return `<ul>${ex.gongs.map((g) => `<li>${esc(t(g.name, lang))}</li>`).join('')}</ul>`;
    case 'ar':
      return paras(t(ex.body, lang));
    case 'costume':
      return `<ul>${ex.costumes.map((c) => `<li>${esc(t(c.name, lang))}</li>`).join('')}</ul>`;
    case 'quiz':
      return `<p>${esc(t(UI.quizCount, lang).replace('{n}', String(ex.questions.length)))}</p>`;
  }
}

function exhibitSection(room: Room, ex: Exhibit, lang: Lang): string {
  return (
    `<section id="${esc(ex.id)}"><h2>${esc(t(ex.title, lang))}</h2>${exhibitBody(ex, lang)}` +
    `<p><button type="button" class="btn open-exhibit" data-open="${esc(`${room.slug}/${ex.id}`)}">${esc(t(UI.open, lang))}</button></p></section>`
  );
}

function roomNav(rooms: Room[], lang: Lang): string {
  const label = esc(t(UI.roomList, lang));
  const items = rooms.map((r) => `<li><a href="${roomPath(r.slug)}">${r.order}. ${esc(t(r.name, lang))}</a></li>`).join('');
  return `<footer><nav aria-label="${label}"><h2>${label}</h2><ul>${items}</ul></nav></footer>`;
}

export function renderHomeText(site: Site, rooms: Room[], lang: Lang): string {
  return `<article><h1>${esc(t(site.name, lang))}</h1>${paras(t(site.welcome, lang))}</article>${roomNav(rooms, lang)}`;
}

export function renderRoomText(site: Site, rooms: Room[], room: Room, lang: Lang): string {
  return (
    `<article><p class="note"><a href="/">${esc(t(site.name, lang))}</a></p>` +
    `<h1>${esc(t(room.name, lang))}</h1>${paras(t(room.intro, lang))}` +
    `${room.exhibits.map((ex) => exhibitSection(room, ex, lang)).join('')}</article>${roomNav(rooms, lang)}`
  );
}
```

- [ ] **Step 4: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/render-html.test.ts`
Expected: PASS (3 test).

- [ ] **Step 5: Viết `src/app/fallback.ts`**

```ts
import type { Exhibit, Room, Site } from '../content/schema';
import { renderHomeText, renderRoomText } from '../content/render-html';
import { renderExhibit } from '../features/registry';
import { SoundPlayer } from '../features/sound';
import { getLang, onLangChange, t } from '../i18n/lang';
import type { Route } from '../nav/route';
import { Panel } from '../ui/panel';
import { createTopBar } from '../ui/topbar';
import { installHooks } from './hooks';

/** Chế độ 2D: bản chữ HTML hiện ra, nút "Xem / nghe" mở cùng khung thông tin như bản 3D. */
export function startFallback(site: Site, rooms: Room[], route: Route, uiEl: HTMLElement, textEl: HTMLElement): void {
  document.body.classList.remove('mode-3d');
  document.body.classList.add('mode-text');
  const room = route.slug ? rooms.find((r) => r.slug === route.slug) : undefined;
  const player = new SoundPlayer();
  const topbar = createTopBar(uiEl, site);
  const panel = new Panel(uiEl);

  const render = () => {
    textEl.innerHTML = room ? renderRoomText(site, rooms, room, getLang()) : renderHomeText(site, rooms, getLang());
  };

  const find = (key: string): Exhibit | null => {
    const [slug, id] = key.split('/');
    return rooms.find((r) => r.slug === slug)?.exhibits.find((e) => e.id === id) ?? null;
  };

  const open = (key: string) => {
    const ex = find(key);
    if (!ex) return;
    panel.open(key, () => t(ex.title), renderExhibit(ex, { player, onGong: () => undefined }));
  };

  textEl.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (!button?.dataset.open) return;
    player.unlock();
    open(button.dataset.open);
  });

  onLangChange(() => {
    render();
    topbar.relang();
    panel.relang();
  });

  render();
  if (room && route.exhibitId) open(`${room.slug}/${route.exhibitId}`);
  installHooks({ mode: 'text', getRoomIndex: () => room?.order ?? 0, getOpenKey: () => panel.openKey, goTo: () => undefined, open });
}
```

- [ ] **Step 6: Sửa `src/main.ts` để dùng chế độ 2D**

Thêm import:

```ts
import { startFallback } from './app/fallback';
```

Thay dòng cuối của `boot()`:

```ts
  document.body.classList.add('mode-text');
}
```

bằng:

```ts
  startFallback(content.site, content.rooms, route, uiEl, textEl);
}
```

- [ ] **Step 7: Kiểm tra chế độ 2D trên dev server**

Run: `npm run dev`. Mở một cửa sổ Chrome riêng có tắt WebGL (đóng hết Chrome trước, hoặc dùng `--user-data-dir` tạm):

```bash
"C:/Program Files/Google/Chrome/Application/chrome.exe" --disable-webgl --user-data-dir="$TEMP/chrome-no-webgl" http://localhost:5173/phong/cong-chieng/
```

Expected: nền kem; thanh trên có tên triển lãm và nút VI / M'Nông; nội dung chữ có `h1` "Văn hóa cồng chiêng"; mỗi mục có nút "Xem / nghe" mở cùng khung thông tin như bản 3D; đổi ngôn ngữ thì chữ đổi theo. Test e2e ở Task 19 kiểm lại tự động.

- [ ] **Step 8: Typecheck, test, commit**

Run: `npm run typecheck && npm test`
Expected: không lỗi; tất cả test PASS.

```bash
git add src/content/render-html.ts src/app/fallback.ts src/main.ts tests/unit/render-html.test.ts
git commit -m "feat: add HTML text version and 2D fallback mode" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 17: SEO: thẻ meta, JSON-LD, trang riêng từng gian, sitemap, robots

**Files:**
- Create: `src/content/seo.ts`, `scripts/build-pages.ts`
- Test: `tests/unit/seo.test.ts`

- [ ] **Step 1: Viết test (sẽ fail)**

```ts
import { describe, expect, it } from 'vitest';
import { absUrl, museumJsonLd, renderHead, robotsTxt, sitemapXml } from '../../src/content/seo';
import { makeSite } from './fixtures';

describe('seo', () => {
  it('absUrl ghép tên miền và đường dẫn', () => {
    expect(absUrl('https://a.com', '/phong/x/')).toBe('https://a.com/phong/x/');
    expect(absUrl('https://a.com/', '/')).toBe('https://a.com/');
  });

  it('renderHead có đủ title, description, canonical, Open Graph, Twitter, JSON-LD', () => {
    const head = renderHead(
      { siteUrl: 'https://a.com', siteName: "Triển lãm M'Nông", locale: 'vi_VN' },
      { title: 'Lễ "cầu mùa"', description: 'Mô tả <ngắn>', path: '/phong/le-cau-mua/', image: '/media/share/le-cau-mua.jpg' },
      { '@type': 'Museum', name: '</script>' },
    );
    expect(head).toContain('<title>Lễ &quot;cầu mùa&quot;</title>');
    expect(head).toContain('<meta name="description" content="Mô tả &lt;ngắn&gt;" />');
    expect(head).toContain('<link rel="canonical" href="https://a.com/phong/le-cau-mua/" />');
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'og:locale', 'og:site_name']) {
      expect(head).toContain(`property="${p}"`);
    }
    expect(head).toContain('content="https://a.com/media/share/le-cau-mua.jpg"');
    expect(head).toContain('<meta name="twitter:card" content="summary_large_image" />');
    expect(head).toContain('\\u003c/script>');
    expect(head).not.toContain('"</script>"');
  });

  it('museumJsonLd dùng kiểu Museum', () => {
    const ld = museumJsonLd('https://a.com', makeSite()) as Record<string, unknown>;
    expect(ld['@type']).toBe('Museum');
    expect(ld.url).toBe('https://a.com/');
  });

  it('sitemap và robots', () => {
    const xml = sitemapXml(['https://a.com/', 'https://a.com/phong/x/']);
    expect(xml).toContain('<loc>https://a.com/phong/x/</loc>');
    const robots = robotsTxt('https://a.com');
    expect(robots).toContain('Allow: /');
    expect(robots).toContain('Disallow: /admin');
    expect(robots).toContain('Sitemap: https://a.com/sitemap.xml');
  });
});
```

- [ ] **Step 2: Chạy test, thấy fail**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: FAIL, không tìm thấy module `src/content/seo`.

- [ ] **Step 3: Viết `src/content/seo.ts`**

```ts
import { esc } from './escape';
import type { Site } from './schema';

export interface SiteMeta {
  siteUrl: string;
  siteName: string;
  locale: string;
}

export interface PageMeta {
  title: string;
  description: string;
  path: string;
  image: string;
}

export function absUrl(siteUrl: string, path: string): string {
  return new URL(path, siteUrl.endsWith('/') ? siteUrl : `${siteUrl}/`).toString();
}

export function renderHead(site: SiteMeta, page: PageMeta, jsonLd: unknown): string {
  const url = absUrl(site.siteUrl, page.path);
  const image = absUrl(site.siteUrl, page.image);
  const meta = (attr: 'name' | 'property', key: string, value: string) => `<meta ${attr}="${key}" content="${esc(value)}" />`;
  return [
    `<title>${esc(page.title)}</title>`,
    meta('name', 'description', page.description),
    `<link rel="canonical" href="${esc(url)}" />`,
    meta('property', 'og:title', page.title),
    meta('property', 'og:description', page.description),
    meta('property', 'og:image', image),
    meta('property', 'og:image:width', '1200'),
    meta('property', 'og:image:height', '630'),
    meta('property', 'og:url', url),
    meta('property', 'og:type', 'website'),
    meta('property', 'og:locale', site.locale),
    meta('property', 'og:site_name', site.siteName),
    meta('name', 'twitter:card', 'summary_large_image'),
    meta('name', 'twitter:title', page.title),
    meta('name', 'twitter:description', page.description),
    meta('name', 'twitter:image', image),
    `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`,
  ].join('\n    ');
}

export function museumJsonLd(siteUrl: string, site: Site): unknown {
  return {
    '@context': 'https://schema.org',
    '@type': 'Museum',
    name: site.name.vi,
    url: absUrl(siteUrl, '/'),
    description: site.seo.description,
    image: absUrl(siteUrl, site.seo.image),
    inLanguage: 'vi',
  };
}

export function sitemapXml(urls: string[]): string {
  const items = urls.map((u) => `  <url><loc>${esc(u)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

export function robotsTxt(siteUrl: string): string {
  return `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${absUrl(siteUrl, '/sitemap.xml')}\n`;
}
```

- [ ] **Step 4: Chạy test, thấy pass**

Run: `npx vitest run tests/unit/seo.test.ts`
Expected: PASS (4 test).

- [ ] **Step 5: Viết `scripts/build-pages.ts`**

```ts
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { PLACEHOLDER_SITE_URL, SITE_LOCALE, SITE_URL } from '../site.config';
import { renderHomeText, renderRoomText } from '../src/content/render-html';
import { absUrl, museumJsonLd, renderHead, robotsTxt, sitemapXml, type PageMeta } from '../src/content/seo';
import { roomPath } from '../src/nav/route';
import { DIST_DIR } from './lib/paths';
import { readContent } from './lib/read-content';

const allowPlaceholder = process.argv.includes('--allow-placeholder-url');
if (SITE_URL === PLACEHOLDER_SITE_URL) {
  if (!allowPlaceholder) {
    console.error(`✖ SITE_URL trong site.config.ts vẫn là giá trị mẫu (${PLACEHOLDER_SITE_URL}). Điền tên miền thật rồi build lại.`);
    process.exit(1);
  }
  console.warn('⚠ Đang build với SITE_URL mẫu – chỉ dùng để xem thử, không đưa lên server.');
}

const template = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');
if (!template.includes('<!--SEO-->') || !template.includes('<!--TEXT-->')) {
  throw new Error('dist/index.html thiếu chỗ đánh dấu <!--SEO--> hoặc <!--TEXT-->');
}

const { site, rooms } = await readContent({ checkFiles: true });
const siteMeta = { siteUrl: SITE_URL, siteName: site.name.vi, locale: SITE_LOCALE };
const jsonLd = museumJsonLd(SITE_URL, site);

const pages: Array<{ meta: PageMeta; text: string; file: string }> = [
  {
    meta: { ...site.seo, path: '/' },
    text: renderHomeText(site, rooms, 'vi'),
    file: path.join(DIST_DIR, 'index.html'),
  },
  ...rooms.map((room) => ({
    meta: { ...room.seo, path: roomPath(room.slug) },
    text: renderRoomText(site, rooms, room, 'vi'),
    file: path.join(DIST_DIR, 'phong', room.slug, 'index.html'),
  })),
];

for (const page of pages) {
  // Dùng hàm thay thế để ký tự "$" trong nội dung không bị hiểu là mẫu thay thế.
  const html = template
    .replace('<!--SEO-->', () => renderHead(siteMeta, page.meta, jsonLd))
    .replace('<!--TEXT-->', () => page.text);
  await mkdir(path.dirname(page.file), { recursive: true });
  await writeFile(page.file, html);
}

await writeFile(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml(pages.map((p) => absUrl(SITE_URL, p.meta.path))));
await writeFile(path.join(DIST_DIR, 'robots.txt'), robotsTxt(SITE_URL));
console.log(`Đã tạo ${pages.length} trang HTML, sitemap.xml và robots.txt trong dist/.`);
```

- [ ] **Step 6: Build bản xem thử và kiểm tra**

Run: `npm run build:preview`
Expected: build xong, dòng `⚠ Đang build với SITE_URL mẫu…` và `Đã tạo 8 trang HTML, sitemap.xml và robots.txt trong dist/.`

Run: `npm run build`
Expected: dừng với `✖ SITE_URL trong site.config.ts vẫn là giá trị mẫu…`, mã thoát 1.

Mở `dist/phong/le-cau-mua/index.html` bằng trình soạn thảo. Mong đợi: `<title>` riêng, `canonical` trỏ `https://example.com/phong/le-cau-mua/`, đủ thẻ `og:*` và `twitter:*`, JSON-LD `Museum`, một `<h1>Lễ cầu mùa</h1>` trong `<main id="text-version">`. Mở `dist/sitemap.xml`: 8 `<loc>`.

Run: `npm run preview`, mở `http://localhost:4173/phong/cong-chieng/`
Expected: vào thẳng gian 1 trong nhà dài 3D. Dừng preview.

- [ ] **Step 7: Commit**

```bash
git add src/content/seo.ts scripts/build-pages.ts tests/unit/seo.test.ts
git commit -m "feat: generate per-room SEO pages, sitemap and robots" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 18: Mã QR và trang in A4

**Files:**
- Create: `scripts/gen-qr.ts`

- [ ] **Step 1: Viết `scripts/gen-qr.ts`**

```ts
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { PLACEHOLDER_SITE_URL, SITE_URL } from '../site.config';
import { esc } from '../src/content/escape';
import { exhibitUrl, roomPath } from '../src/nav/route';
import { ROOT_DIR } from './lib/paths';
import { readContent } from './lib/read-content';

interface QrItem {
  file: string;
  label: string;
  url: string;
}

const OUT_DIR = path.join(ROOT_DIR, 'qr');

function printSheet(items: QrItem[]): string {
  const cards = items
    .map((it) => `<figure><img src="${esc(it.file)}.svg" alt="" /><figcaption><b>${esc(it.label)}</b><small>${esc(it.url)}</small></figcaption></figure>`)
    .join('\n');
  return `<!doctype html>
<html lang="vi"><head><meta charset="UTF-8" /><title>Mã QR – Triển lãm M'Nông</title>
<style>
@page { size: A4; margin: 12mm; }
body { font-family: "Segoe UI", Arial, sans-serif; margin: 0; }
main { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
figure { margin: 0; border: 1px solid #ccc; border-radius: 4mm; padding: 4mm; text-align: center; break-inside: avoid; }
img { width: 100%; }
figcaption b { display: block; font-size: 11pt; }
figcaption small { display: block; font-size: 7pt; color: #666; word-break: break-all; }
</style></head>
<body><main>
${cards}
</main></body></html>
`;
}

if (SITE_URL === PLACEHOLDER_SITE_URL) console.warn('⚠ SITE_URL vẫn là giá trị mẫu – mã QR này chỉ để thử.');

const { site, rooms } = await readContent({ checkFiles: false });
const base = SITE_URL.replace(/\/$/, '');
const items: QrItem[] = [
  { file: 'trang-chinh', label: site.name.vi, url: `${base}/` },
  ...rooms.flatMap((room) => [
    { file: `gian-${room.order}-${room.slug}`, label: `Gian ${room.order}: ${room.name.vi}`, url: `${base}${roomPath(room.slug)}` },
    ...room.exhibits.map((ex) => ({
      file: `gian-${room.order}-${room.slug}--${ex.id}`,
      label: `Gian ${room.order} · ${ex.title.vi}`,
      url: exhibitUrl(base, room.slug, ex.id),
    })),
  ]),
];

await mkdir(OUT_DIR, { recursive: true });
for (const item of items) {
  await QRCode.toFile(path.join(OUT_DIR, `${item.file}.png`), item.url, { width: 800, margin: 2, errorCorrectionLevel: 'M' });
  await writeFile(path.join(OUT_DIR, `${item.file}.svg`), await QRCode.toString(item.url, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' }));
}
await writeFile(path.join(OUT_DIR, 'index.html'), printSheet(items));
console.log(`Đã tạo ${items.length} mã QR trong qr/ – mở qr/index.html để in.`);
```

- [ ] **Step 2: Chạy**

Run: `npm run qr`
Expected: cảnh báo SITE_URL mẫu, rồi `Đã tạo 34 mã QR trong qr/ – mở qr/index.html để in.` (1 trang chính + 7 gian + 26 hiện vật).

Mở `qr/index.html` trong trình duyệt, Ctrl+P: lưới 3 cột trên khổ A4. Quét thử một mã bằng điện thoại: link dạng `https://example.com/phong/cong-chieng/?v=bo-chieng`.

- [ ] **Step 3: Typecheck và commit**

Run: `npm run typecheck`
Expected: không có lỗi.

```bash
git add scripts/gen-qr.ts
git commit -m "feat: generate QR codes and printable A4 sheet" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 19: Kiểm thử e2e (Playwright)

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/exhibition.spec.ts`

- [ ] **Step 1: Cài trình duyệt cho Playwright**

Run: `npx playwright install chromium`
Expected: tải xong Chromium.

- [ ] **Step 2: Viết `playwright.config.ts`**

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build:preview && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

- [ ] **Step 3: Viết `tests/e2e/exhibition.spec.ts`**

```ts
import { expect, test } from '@playwright/test';

const roomIs = (index: number) => `window.__exhibition?.roomIndex === ${index}`;

test('vào nhà dài và chuyển gian bằng thanh dưới', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await expect(page.locator('#stage canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Vào nhà dài' }).click();
  await page.waitForFunction(roomIs(0));
  await page.locator('.rb-next').click();
  await page.waitForFunction(roomIs(1));
  await expect(page).toHaveURL(/\/phong\/cong-chieng\/$/);
  await expect(page.locator('.rb-current')).toContainText('Văn hóa cồng chiêng');
});

test('link hiện vật mở sẵn khung thông tin, đổi ngôn ngữ', async ({ page }) => {
  await page.goto('/phong/cong-chieng/?v=gioi-thieu');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'cong-chieng/gioi-thieu');
  const title = page.locator('#panel-title');
  await expect(title).toHaveText('Giới thiệu cồng chiêng');
  await expect(page.getByRole('button', { name: /Nghe thuyết minh/ })).toBeVisible();
  await page.getByRole('button', { name: "M'Nông", exact: true }).click();
  await expect(title).toHaveText("[M'Nông] Giới thiệu cồng chiêng");
  await page.reload();
  await page.waitForFunction(() => window.__exhibition?.mode === '3d');
  await expect(page.getByRole('button', { name: "M'Nông", exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('làm hết trắc nghiệm và thấy tổng điểm', async ({ page }) => {
  await page.goto('/phong/trac-nghiem/?v=cau-hoi');
  await page.waitForFunction(() => window.__exhibition?.openKey === 'trac-nghiem/cau-hoi');
  for (let i = 0; i < 5; i++) {
    await page.locator('.q-options button').first().click();
    await expect(page.locator('.q-feedback')).toBeVisible();
    await page.getByRole('button', { name: 'Câu tiếp' }).click();
  }
  await expect(page.locator('.q-score')).toHaveText(/Bạn trả lời đúng \d\/5 câu/);
  await page.getByRole('button', { name: 'Chơi lại' }).click();
  await expect(page.locator('.q-progress')).toHaveText('Câu 1/5');
});

test('máy không có WebGL: hiện bản 2D và vẫn mở được hiện vật', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...args: unknown[]) {
      if (type.startsWith('webgl')) return null;
      return (original as (...a: unknown[]) => unknown).call(this, type, ...args);
    } as typeof original;
  });
  await page.goto('/phong/cong-chieng/');
  await page.waitForFunction(() => window.__exhibition?.mode === 'text');
  await expect(page.locator('#text-version h1')).toHaveText('Văn hóa cồng chiêng');
  await page.locator('[data-open="cong-chieng/bo-chieng"]').click();
  await expect(page.locator('#panel-title')).toHaveText('Sáu loại chiêng');
  await expect(page.locator('.p-gongs button')).toHaveCount(6);
});

test('trang gian có đủ thẻ SEO và đúng một h1', async ({ request }) => {
  const html = await (await request.get('/phong/le-cau-mua/')).text();
  expect(html).toContain('<link rel="canonical" href="https://example.com/phong/le-cau-mua/" />');
  expect(html).toContain('property="og:image" content="https://example.com/media/share/le-cau-mua.jpg"');
  expect(html).toContain('"@type":"Museum"');
  expect(html.match(/<h1>/g)).toHaveLength(1);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap.match(/<loc>/g)).toHaveLength(8);
});
```

- [ ] **Step 4: Chạy e2e**

Run: `npm run test:e2e`
Expected: 10 test PASS (5 test × 2 project mobile/desktop). Nếu test 3D fail vì trình duyệt headless không có WebGL, chạy `npx playwright test --headed` để xác nhận; ghi lại kết quả.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts tests/e2e
git commit -m "test: add Playwright e2e for navigation, deep links, quiz, fallback and SEO" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 20: Tài liệu bàn giao, cấu hình server, kiểm tra cuối

**Files:**
- Create: `docs/HUONG-DAN-NOI-DUNG.md`, `deploy/nginx.conf.example`, `README.md`

- [ ] **Step 1: Viết `docs/HUONG-DAN-NOI-DUNG.md`**

````markdown
# Hướng dẫn thay nội dung triển lãm

Mọi nội dung nằm trong thư mục `public/`. Không cần sửa code.

## 1. Chữ giới thiệu (tiếng Việt và tiếng M'Nông)

- Trang chủ và lời chào ở sảnh: `public/content/site.json`
- Mỗi gian một file: `public/content/rooms/01-cong-chieng.json` … `07-trac-nghiem.json`
- Mọi chữ có dạng `{ "vi": "…", "mnong": "…" }`. Thay chữ `[M'Nông] …` bằng bản dịch thật.
- Xuống dòng hai lần (`\n\n`) để tách đoạn.

## 2. Ảnh

- Đặt ảnh vào `public/media/<tên-gian>/`, ví dụ `public/media/le-cau-mua/anh-1.jpg`.
- Có thể ghi đè đúng tên file ảnh mẫu, hoặc thêm ảnh mới vào mục `images` của hiện vật `gallery`:
  `{ "src": "/media/le-cau-mua/anh-5.jpg", "alt": { "vi": "Mô tả ảnh", "mnong": "…" } }`
- Ảnh nên rộng tối đa 1600px, dạng JPG.
- Ảnh chia sẻ Facebook/Zalo: `public/media/share/*.jpg`, đúng 1200×630, JPG.

## 3. Video YouTube

- Đăng video ở chế độ **Không công khai**.
- Link `https://www.youtube.com/watch?v=AbCdEfGhIjK` → `youtubeId` là `AbCdEfGhIjK` (11 ký tự).

## 4. Âm thanh

- 6 tiếng chiêng: `public/media/cong-chieng/chieng-1.wav` … `chieng-6.wav` (có thể dùng `.mp3`, nhớ sửa đuôi trong JSON).
- Thuyết minh: thêm `"narration": { "vi": "/media/…/tm-vi.mp3", "mnong": "/media/…/tm-mnong.mp3" }` vào hiện vật `board`. Thiếu ngôn ngữ nào thì nút nghe tự ẩn ở ngôn ngữ đó.

## 5. Trang phục để chụp ảnh

- Mỗi bộ cần một ảnh PNG nền trong suốt, tỉ lệ 3:4 (ví dụ 900×1200), phần đầu để trống cho mặt khách, và một ảnh nhỏ 300×400.
- Khai báo trong mục `costumes` của hiện vật `costume` ở `06-trang-phuc.json`.

## 6. Mô hình 3D cho AR

- Thêm hiện vật `ar` với `glb` (Android, máy tính) và `usdz` (iPhone).
- Mỗi gian có 6 chỗ trên vách: `"position": { "wall": "left" | "right", "slot": 0 | 1 | 2 }`, không trùng nhau.

## 7. Câu hỏi trắc nghiệm

- `07-trac-nghiem.json`, mục `questions`. Mỗi câu 4 đáp án; `answer` là số thứ tự đáp án đúng, đếm từ 0.

## 8. Kiểm tra và đưa lên

```bash
npm run check:content
npm run build
npm run qr
```

- `check:content` báo rõ file và trường bị sai, thiếu file ảnh/âm thanh.
- `build` tạo thư mục `dist/`; chép toàn bộ `dist/` lên server.
- `qr` tạo mã QR trong `qr/`, mở `qr/index.html` để in.
- Thêm gian hoặc hiện vật mới mà chưa có ảnh: chạy `npm run assets` để tạo ảnh mẫu tạm.
````

- [ ] **Step 2: Viết `deploy/nginx.conf.example`**

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/trien-lam-mnong/dist;
    index index.html;

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml model/gltf-binary;

    location /assets/  { expires 1y; add_header Cache-Control "public, immutable"; }
    location /media/   { expires 30d; }
    location /content/ { add_header Cache-Control "no-cache"; }

    location ~* \.glb$  { default_type model/gltf-binary; expires 30d; }
    location ~* \.usdz$ { default_type model/vnd.usdz+zip; expires 30d; }

    location / { try_files $uri $uri/ /index.html; }
}
```

- [ ] **Step 3: Viết `README.md`**

````markdown
# Triển lãm số văn hóa M'Nông – Web AR (nhà dài 3D)

Thiết kế: `docs/superpowers/specs/2026-10-30-trien-lam-3d-mnong-design.md`
Thay nội dung: `docs/HUONG-DAN-NOI-DUNG.md`

```bash
npm install
npm run dev            # http://localhost:5173
npm test               # unit test
npm run test:e2e       # e2e (Playwright)
npm run build          # cần điền SITE_URL trong site.config.ts
```
````

- [ ] **Step 4: Kiểm tra cuối**

Run: `npm run check:content && npm run typecheck && npm test && npm run test:e2e`
Expected: tất cả PASS.

Run: `npm run build:preview`, rồi xem dung lượng tải lần đầu: mở `npm run preview`, DevTools → Network, tắt cache, Fast 4G, tải `http://localhost:4173/`.
Expected: tổng dung lượng lần tải đầu dưới khoảng 5MB (spec mục 10). Nếu vượt, giảm `textures/*.jpg` hoặc chất lượng JPG trong `gen-placeholders.ts`.

Đối chiếu checklist SEO trong tài liệu thiết kế mục 8; ghi mục nào chưa đạt (dự kiến: chỉ còn `SITE_URL` chưa có tên miền thật).

- [ ] **Step 5: Thử trên máy thật (ghi kết quả vào commit hoặc báo cáo)**

Đưa bản `build:preview` lên một địa chỉ HTTPS thử (camera và AR cần HTTPS), rồi trên iPhone và một máy Android:
- Đi hết 7 gian bằng vòng tròn và thanh dưới, cảm nhận độ mượt.
- Bấm 6 chiêng, nghe tiếng ngay.
- Mở AR ở gian 1, đặt chiêng xuống mặt bàn.
- Chụp ảnh mặc trang phục bằng camera trước và sau, tải ảnh về.
- Quét một mã QR in ra, mở đúng hiện vật.

- [ ] **Step 6: Commit**

```bash
git add docs/HUONG-DAN-NOI-DUNG.md deploy README.md
git commit -m "docs: add content guide, nginx example and README" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
