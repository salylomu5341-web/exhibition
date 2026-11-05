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
  const label = h('button', { type: 'button', class: 'rb-current', 'aria-controls': 'roomlist', 'aria-expanded': 'false' });
  const next = h('button', { type: 'button', class: 'rb-next' });
  const list = h('ul', { class: 'roomlist', id: 'roomlist', hidden: '' });
  const nav = h('nav', { class: 'roombar' }, prev, label, next);
  host.append(list, nav);

  const toggleList = (open: boolean) => {
    list.hidden = !open;
    label.setAttribute('aria-expanded', String(open));
  };
  prev.addEventListener('click', () => {
    toggleList(false);
    onGo(Math.max(-1, current - 1));
  });
  next.addEventListener('click', () => {
    toggleList(false);
    onGo(Math.min(rooms.length, current + 1));
  });
  label.addEventListener('click', () => toggleList(list.hidden));

  const nameOf = (i: number) =>
    i === -1 ? t(UI.courtyard) : i === 0 ? t(UI.hall) : `${i}/${rooms.length} · ${t(rooms[i - 1].name)}`;

  const render = () => {
    // Dưới 420px chữ .w bị ẩn nên tên nút nằm ở aria-label.
    prev.replaceChildren(h('span', { 'aria-hidden': 'true' }, '◀ '), h('span', { class: 'w' }, t(UI.prevRoom)));
    next.replaceChildren(h('span', { class: 'w' }, t(UI.nextRoom)), h('span', { 'aria-hidden': 'true' }, ' ▶'));
    prev.setAttribute('aria-label', t(UI.prevRoom));
    next.setAttribute('aria-label', t(UI.nextRoom));
    nav.setAttribute('aria-label', t(UI.roomList));
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
