import QRCode from 'qrcode';
import type { Book, Lang, Room, Site } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { BOOK_PATH } from '../book/pages';
import { roomPath } from '../nav/route';
import { h } from '../ui/dom';
import type { SheetData } from './layout';

declare const __SITE_URL__: string;
declare const __SITE_URL_IS_SAMPLE__: boolean;

/** Tên miền in trong mã QR: SITE_URL lúc build; còn là giá trị mẫu thì dùng tên miền đang mở. */
export function qrBase(): { base: string; sample: boolean } {
  const sample = __SITE_URL_IS_SAMPLE__;
  return { base: (sample ? location.origin : __SITE_URL__).replace(/\/$/, ''), sample };
}

export interface SheetContext {
  site: Site;
  book: Book;
  rooms: Room[];
  lang: Lang;
  base: string;
  /** Sách tải ảnh khi lật tới; trang in cần mọi ảnh ngay. */
  lazy: boolean;
}

/** Cỡ chữ thân bài (px): bắt đầu từ cỡ lớn nhất rồi thu dần tới khi vừa tờ. */
const FONT_MAX = 16;
const FONT_MIN = 9.5;
const FONT_STEP = 0.5;

async function qr(url: string): Promise<HTMLElement> {
  const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' });
  const box = h('span', { class: 'sh-qr-code' });
  box.innerHTML = svg;
  return box;
}

function photo(src: string, alt: string, lazy: boolean): HTMLElement {
  const img = h('img', { src, alt, decoding: 'async', draggable: 'false' });
  if (lazy) img.loading = 'lazy';
  const fig = h('figure', { class: 'sh-photo' }, img);
  // Ảnh hiện trọn, không cắt; phần khung còn trống lấp bằng chính ảnh đó làm mờ (đặt sau khi tải để giữ tải chậm).
  img.addEventListener('load', () => fig.style.setProperty('--photo', `url(${JSON.stringify(img.currentSrc || src)})`));
  // Ảnh lỗi: ẩn đi, chỉ còn nền khung.
  img.addEventListener('error', () => img.classList.add('broken'));
  return fig;
}

async function footer(url: string, label: string, href: string): Promise<HTMLElement> {
  return h(
    'footer',
    { class: 'sh-foot' },
    h('div', { class: 'sh-foot-text' }, h('b', {}, label), h('a', { href }, url.replace(/^https?:\/\//, ''))),
    h('a', { class: 'sh-qr', href, 'aria-label': label }, await qr(url)),
  );
}

/** Một mã QR kèm nhãn và địa chỉ, đứng dọc; trang cuối xếp hai ô này cạnh nhau. */
async function qrCard(url: string, label: string, href: string): Promise<HTMLElement> {
  return h(
    'a',
    { class: 'sh-qr-card', href },
    h('span', { class: 'sh-qr' }, await qr(url)),
    h('b', {}, label),
    h('span', { class: 'sh-qr-url' }, url.replace(/^https?:\/\//, '')),
  );
}

async function roomSheet(data: Extract<SheetData, { kind: 'room' }>, ctx: SheetContext): Promise<HTMLElement> {
  const { room, part, parts, blocks, photos } = data;
  const path = roomPath(room.slug);
  const kicker = `${t(UI.roomNo, ctx.lang).replace('{n}', String(room.order))} · ${t(ctx.site.name, ctx.lang)}`;
  const title = h('h2', { class: 'sh-title' }, t(room.name, ctx.lang));
  if (part > 1) title.append(' ', h('small', {}, t(UI.continued, ctx.lang)));
  const text = h('div', { class: 'sh-text' }, ...blocks.map((b) => h(b.heading ? 'h3' : 'p', {}, b.text)));
  const el = h(
    'article',
    { class: `sheet sheet-room ${part === 1 ? 'first' : 'cont'}` },
    h('header', { class: 'sh-head' }, h('p', { class: 'sh-kicker' }, kicker), title),
    photos.length ? h('div', { class: `sh-photos n${photos.length}` }, ...photos.map((p) => photo(p.src, p.alt, ctx.lazy))) : null,
    text,
    await footer(`${ctx.base}${path}`, t(UI.scanToRoom, ctx.lang), path),
  );
  el.dataset.room = room.slug;
  el.dataset.part = `${part}/${parts}`;
  return el;
}

async function coverSheet(ctx: SheetContext): Promise<HTMLElement> {
  if (ctx.book.cover) {
    return h(
      'article',
      { class: 'sheet sheet-cover has-image' },
      // Nền: chính ảnh bìa làm mờ; ảnh hiện trọn ở giữa (ảnh ngang trên trang đứng, không cắt).
      h('div', { class: 'sh-cover-bg', style: `background-image: url(${JSON.stringify(ctx.book.cover)})` }),
      h('img', { class: 'sh-cover-img', src: ctx.book.cover, alt: t(ctx.book.title, ctx.lang) }),
      h('div', { class: 'sh-cover-band' }, h('p', { class: 'sh-cover-name' }, t(ctx.book.title, ctx.lang))),
    );
  }
  return h(
    'article',
    { class: 'sheet sheet-cover' },
    h(
      'div',
      { class: 'sh-cover-inner' },
      h('p', { class: 'sh-kicker' }, t(ctx.site.name, ctx.lang)),
      h('h2', { class: 'sh-cover-title' }, t(ctx.book.title, ctx.lang)),
      h('p', { class: 'sh-cover-intro' }, t(ctx.book.intro, ctx.lang)),
    ),
  );
}

async function backSheet(ctx: SheetContext): Promise<HTMLElement> {
  const rooms = ctx.rooms.map((r) => h('li', {}, h('a', { href: roomPath(r.slug) }, t(r.name, ctx.lang))));
  return h(
    'article',
    { class: 'sheet sheet-back' },
    h('header', { class: 'sh-head' }, h('p', { class: 'sh-kicker' }, t(ctx.site.name, ctx.lang)), h('h2', { class: 'sh-title' }, t(UI.visitLonghouse, ctx.lang))),
    h('ol', { class: 'sh-rooms' }, ...rooms),
    h(
      'footer',
      { class: 'sh-foot sh-foot-two' },
      await qrCard(`${ctx.base}/`, t(UI.scanToHome, ctx.lang), '/'),
      await qrCard(`${ctx.base}${BOOK_PATH}`, t(UI.scanToBook, ctx.lang), BOOK_PATH),
    ),
  );
}

export function renderSheet(data: SheetData, ctx: SheetContext): Promise<HTMLElement> {
  if (data.kind === 'cover') return coverSheet(ctx);
  if (data.kind === 'back') return backSheet(ctx);
  return roomSheet(data, ctx);
}

export function renderSheets(sheets: SheetData[], ctx: SheetContext): Promise<HTMLElement[]> {
  return Promise.all(sheets.map((s) => renderSheet(s, ctx)));
}

/** Thu cỡ chữ thân bài tới khi vừa khung (tờ phải đang nằm trong trang, không bị ẩn). */
export function fitSheet(sheet: HTMLElement): void {
  const text = sheet.querySelector<HTMLElement>('.sh-text');
  if (!text) return;
  const overflows = () => text.scrollHeight > text.clientHeight + 1 || text.scrollWidth > text.clientWidth + 1;
  let size = FONT_MAX;
  text.style.fontSize = `${size}px`;
  while (overflows() && size > FONT_MIN) {
    size -= FONT_STEP;
    text.style.fontSize = `${size}px`;
  }
}

/** Đo và thu chữ ở chỗ khuất màn hình, cho các tờ chưa gắn vào trang (như trang sách). */
export async function fitOffscreen(sheets: HTMLElement[]): Promise<void> {
  await document.fonts.ready;
  const box = h('div', { class: 'sheet-measure', 'aria-hidden': 'true' }, ...sheets);
  document.body.append(box);
  sheets.forEach(fitSheet);
  box.remove();
}
