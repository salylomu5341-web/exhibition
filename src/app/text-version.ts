import type { Room, Site } from '../content/schema';
import { renderHomeText, renderRoomText } from '../content/render-html';
import { getLang, onLangChange } from '../i18n/lang';

/**
 * Gắn bản chữ HTML (`#text-version`): vẽ theo ngôn ngữ hiện tại, vẽ lại khi đổi ngôn ngữ,
 * và một trình nghe click chung cho các nút `[data-open]`.
 */
export function mountTextVersion(
  textEl: HTMLElement,
  site: Site,
  rooms: Room[],
  room: Room | undefined,
  onOpen: (key: string) => void,
  afterRender?: () => void,
): { render(): void } {
  const render = () => {
    textEl.innerHTML = room ? renderRoomText(site, rooms, room, getLang()) : renderHomeText(site, rooms, getLang());
    afterRender?.();
  };

  textEl.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-open]');
    if (!button?.dataset.open) return;
    onOpen(button.dataset.open);
  });

  onLangChange(render);
  render();
  return { render };
}
