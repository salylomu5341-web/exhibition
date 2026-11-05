import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

export interface TocItem {
  title: string;
  /** Chỉ số trang (từ 0). */
  index: number;
}

/** Mục lục: mỗi gian một dòng kèm số trang; `items` đọc lại mỗi lần đổi ngôn ngữ vì số trang có thể đổi. */
export function renderToc(items: () => TocItem[], onPick: (index: number) => void): PanelContent {
  const el = h('div', { class: 'p-toc' });
  const update = () => {
    const rows = items().map((item) => {
      const btn = h('button', { type: 'button', class: 'toc-item' }, h('span', {}, item.title), h('span', { class: 'toc-page' }, String(item.index + 1)));
      btn.addEventListener('click', () => onPick(item.index));
      return h('li', {}, btn);
    });
    el.replaceChildren(
      h('ol', { class: 'toc-list' }, ...rows),
      // Màn hẹp ẩn link này trên thanh trên, nên đặt thêm ở đây.
      h('p', { class: 'toc-home' }, h('a', { class: 'btn secondary', href: '/' }, t(UI.toExhibition))),
    );
  };
  update();
  return { el, update, dispose: () => undefined };
}
