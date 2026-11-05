import type { Book, Room, Site } from '../content/schema';
import { getLang, onLangChange, t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { buildSheets, roomStarts, slugAt, type SheetData } from '../sheets/layout';
import { fitOffscreen, qrBase, renderSheets } from '../sheets/render';
import { h } from '../ui/dom';
import { Panel } from '../ui/panel';
import { createTopBar } from '../ui/topbar';
import { bookPath, pageLabel, parsePageParam, spreadOf } from './pages';
import { renderToc } from './toc';
import { BookView } from './view';

export interface BookHooks {
  /** Trang đầu của cặp đang mở, đánh số từ 1. */
  readonly page: number;
  readonly pageCount: number;
  readonly twoPage: boolean;
  go(page: number): void;
}

declare global {
  interface Window {
    /** Dùng cho kiểm thử e2e và gỡ lỗi. */
    __book?: BookHooks;
  }
}

export async function startBook(site: Site, rooms: Room[], book: Book, stageEl: HTMLElement, uiEl: HTMLElement): Promise<void> {
  document.body.classList.add('mode-book');
  const { base } = qrBase();

  const tocBtn = h('button', { type: 'button', class: 'tb-btn' });
  const home = h('a', { class: 'tb-btn', href: '/' });
  const topbar = createTopBar(uiEl, book.title, { actions: [tocBtn, home] });

  const prev = h('button', { type: 'button' }, '◀');
  const next = h('button', { type: 'button' }, '▶');
  const label = h('span', { class: 'rb-current', 'aria-live': 'polite' });
  uiEl.append(h('nav', { class: 'roombar book-bar' }, prev, label, next));
  // Gợi ý đè lên chân sách nên chỉ hiện lúc đầu: tắt sau lần lật đầu tiên hoặc sau vài giây.
  const hint = h('p', { class: 'book-hint' });
  uiEl.append(hint);
  setTimeout(() => {
    hint.hidden = true;
  }, 6000);
  const panel = new Panel(uiEl);

  let data: SheetData[] = [];
  const count = () => data.length;
  const updateBar = (index: number, twoPage: boolean) => {
    const spread = spreadOf(index, count(), twoPage);
    label.textContent = t(UI.pageOf).replace('{p}', pageLabel(index, count(), twoPage)).replace('{n}', String(count()));
    prev.disabled = spread[0] === 0;
    next.disabled = spread[spread.length - 1] === count() - 1;
  };

  // BookView gọi onChange ngay khi dựng xong, lúc `view` chưa được gán.
  let view: BookView | null = null;
  let start = 0;
  const onChange = (index: number) => {
    if (!view) return;
    updateBar(index, view.twoPage);
    const path = bookPath(spreadOf(index, count(), view.twoPage)[0]);
    if (location.pathname + location.search !== path) history.replaceState(null, '', path);
    if (index !== start) hint.hidden = true;
  };
  const bookView = new BookView(stageEl, onChange);
  view = bookView;

  /** Dựng các tờ theo ngôn ngữ đang chọn và mở ở trang `at` (hàm nhận danh sách tờ mới). */
  let loading = 0;
  const loadSheets = async (at: (sheets: SheetData[]) => number) => {
    const run = ++loading;
    const lang = getLang();
    const fresh = buildSheets(rooms, lang);
    const els = await renderSheets(fresh, { site, book, rooms, lang, base, lazy: true });
    await fitOffscreen(els);
    if (run !== loading) return;
    const index = at(fresh);
    data = fresh;
    bookView.load(els, index);
  };

  prev.addEventListener('click', () => bookView.prev());
  next.addEventListener('click', () => bookView.next());
  const tocItems = () => [...roomStarts(data)].map(([slug, index]) => ({ title: t(rooms.find((r) => r.slug === slug)!.name), index }));
  const openToc = () =>
    panel.open('toc', () => t(UI.toc), renderToc(tocItems, (i) => {
      panel.close();
      bookView.go(i);
    }));
  tocBtn.addEventListener('click', openToc);

  document.addEventListener('keydown', (e) => {
    if (panel.openKey || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select')) return;
    if (e.key === 'ArrowRight') bookView.next();
    else if (e.key === 'ArrowLeft') bookView.prev();
  });

  const relangUi = () => {
    topbar.relang();
    tocBtn.textContent = `☰ ${t(UI.toc)}`;
    home.textContent = t(UI.toExhibition);
    prev.setAttribute('aria-label', t(UI.prevPage));
    next.setAttribute('aria-label', t(UI.nextPage));
    hint.textContent = t(UI.bookHint);
  };
  relangUi();

  await loadSheets((sheets) => (start = parsePageParam(location.search, sheets.length)));
  onLangChange(() => {
    relangUi();
    // Số tờ mỗi gian có thể khác giữa hai thứ tiếng: giữ đúng gian đang đọc (bìa, trang cuối giữ nguyên).
    const old = data;
    const at = bookView.index;
    void loadSheets((sheets) => {
      const slug = slugAt(old, at);
      if (slug) return roomStarts(sheets).get(slug) ?? 0;
      return at === old.length - 1 ? sheets.length - 1 : 0;
    }).then(() => panel.relang());
  });

  window.__book = {
    get page() {
      return spreadOf(bookView.index, count(), bookView.twoPage)[0] + 1;
    },
    get pageCount() {
      return count();
    },
    get twoPage() {
      return bookView.twoPage;
    },
    go: (page) => bookView.go(Math.min(Math.max(page, 1), count()) - 1),
  };
}
