import { BOOK_PATH } from '../book/pages';
import type { Site } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export function createIntro(host: HTMLElement, site: Site, onEnter: () => void): { hide(): void; relang(): void } {
  const title = h('p', { class: 'intro-title' });
  const welcome = h('p', { class: 'intro-welcome' });
  const hint = h('p', { class: 'note' });
  const enter = h('button', { type: 'button', class: 'btn' });
  enter.addEventListener('click', onEnter);
  const book = h('a', { class: 'intro-book', href: BOOK_PATH });
  const el = h('div', { class: 'intro' }, h('div', { class: 'intro-card' }, title, welcome, hint, enter, book));
  host.append(el);

  const finePointer = typeof matchMedia === 'function' && matchMedia('(pointer: fine)').matches;
  const relang = () => {
    title.textContent = t(site.name);
    welcome.textContent = t(site.welcome);
    hint.textContent = t(finePointer ? UI.hintDesktop : UI.hint);
    enter.textContent = t(UI.enter);
    book.textContent = t(UI.readBook);
  };
  relang();
  return {
    hide: () => {
      el.hidden = true;
    },
    relang,
  };
}
