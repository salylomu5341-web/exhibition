import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

let zoomEl: HTMLElement | null = null;
let zoomOpener: HTMLElement | null = null;

function closeZoom(restoreFocus = true): void {
  zoomEl?.remove();
  zoomEl = null;
  const back = zoomOpener;
  zoomOpener = null;
  if (restoreFocus && back?.isConnected) back.focus({ preventScroll: true });
}

function openZoom(src: string, alt: string, opener: HTMLElement): void {
  closeZoom(false);
  zoomOpener = opener;
  const close = h('button', { type: 'button', class: 'zoom-close', 'aria-label': t(UI.close) }, '✕');
  const layer = h('div', { class: 'zoom', role: 'dialog', 'aria-modal': 'true', 'aria-label': alt, tabindex: '-1' }, h('img', { src, alt }), close);
  layer.addEventListener('click', () => closeZoom());
  layer.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation(); // chỉ đóng ảnh, không đóng cả khung thông tin
    closeZoom();
  });
  zoomEl = layer;
  document.body.append(layer);
  layer.focus({ preventScroll: true });
}

export function renderGallery(ex: ExhibitOf<'gallery'>): PanelContent {
  const el = h('div', { class: 'p-gallery' });
  const update = () => {
    el.replaceChildren(
      ...ex.images.map((img) => {
        const pic = h('img', { src: img.src, alt: t(img.alt), loading: 'lazy' });
        pic.addEventListener('error', () => pic.replaceWith(h('div', { class: 'media-missing' }, `${t(UI.mediaError)}: ${t(img.alt)}`)));
        const open = h('button', { type: 'button', class: 'p-gallery-open', 'aria-label': t(img.alt) }, pic);
        open.addEventListener('click', () => openZoom(img.src, t(img.alt), open));
        return h('figure', {}, open, img.caption ? h('figcaption', {}, t(img.caption)) : null);
      }),
    );
  };
  update();
  return { el, update, dispose: () => closeZoom(false) };
}
