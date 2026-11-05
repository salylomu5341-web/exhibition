import { BOOK_PATH } from '../book/pages';
import type { LText } from '../content/schema';
import { getLang, setLang, t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export interface TopBarOptions {
  /** false: ẩn nút đổi ngôn ngữ (ví dụ sách chưa có bộ trang M'Nông). */
  showLang?: boolean;
  /** Nút thêm, đặt trước nhóm ngôn ngữ. */
  actions?: HTMLElement[];
  /** Nút "Đọc sách 3D" để vào sách ngay từ nhà dài, không phải quay lại trang chủ. */
  book?: boolean;
}

export interface TopBar {
  relang(): void;
  /** Thêm nút vào sau (ví dụ nút đếm khách ảo, tải sau). */
  addAction(el: HTMLElement): void;
}

export function createTopBar(host: HTMLElement, name: LText, opts: TopBarOptions = {}): TopBar {
  const title = h('span', { class: 'site-title' });
  const vi = h('button', { type: 'button' }, 'VI');
  const mnong = h('button', { type: 'button' }, "M'Nông");
  vi.addEventListener('click', () => setLang('vi'));
  mnong.addEventListener('click', () => setLang('mnong'));
  const group = h('div', { class: 'lang', role: 'group' }, vi, mnong);
  group.hidden = opts.showLang === false;
  const bookText = h('span', { class: 'tb-text' });
  const book = opts.book ? h('a', { class: 'tb-btn tb-book', href: BOOK_PATH }, h('span', { 'aria-hidden': 'true' }, '📖'), bookText) : null;
  const actions = [...(book ? [book] : []), ...(opts.actions ?? [])];
  const right = h('div', { class: 'tb-actions' }, ...actions, group);
  host.append(h('header', { class: 'topbar' }, title, right));

  const relang = () => {
    const lang = getLang();
    title.textContent = t(name);
    bookText.textContent = t(UI.readBook);
    book?.setAttribute('aria-label', t(UI.readBook));
    vi.setAttribute('aria-pressed', String(lang === 'vi'));
    mnong.setAttribute('aria-pressed', String(lang === 'mnong'));
    group.setAttribute('aria-label', t(UI.language));
  };
  relang();
  return { relang, addAction: (el) => right.insertBefore(el, group) };
}
