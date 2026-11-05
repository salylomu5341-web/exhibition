import type { Exhibit, Room, Site } from '../content/schema';
import { renderExhibit } from '../features/registry';
import { SoundPlayer } from '../features/sound';
import { onLangChange, t } from '../i18n/lang';
import type { Route } from '../nav/route';
import { Panel } from '../ui/panel';
import { createTopBar } from '../ui/topbar';
import { installHooks } from './hooks';
import { mountTextVersion } from './text-version';

/** Chế độ 2D: bản chữ HTML hiện ra, nút "Xem / nghe" mở cùng khung thông tin như bản 3D. */
export function startFallback(site: Site, rooms: Room[], route: Route, uiEl: HTMLElement, textEl: HTMLElement): void {
  document.body.classList.remove('mode-3d');
  document.body.classList.add('mode-text');
  const room = route.slug ? rooms.find((r) => r.slug === route.slug) : undefined;
  const player = new SoundPlayer();
  const topbar = createTopBar(uiEl, site.name, { book: true });
  const panel = new Panel(uiEl);

  const find = (key: string): Exhibit | null => {
    const [slug, id] = key.split('/');
    return rooms.find((r) => r.slug === slug)?.exhibits.find((e) => e.id === id) ?? null;
  };

  const open = (key: string) => {
    const ex = find(key);
    if (!ex) return;
    panel.open(key, () => t(ex.title), renderExhibit(ex, { player, onGong: () => undefined }));
  };

  mountTextVersion(
    textEl,
    site,
    rooms,
    room,
    (key) => {
      player.unlock();
      open(key);
    },
    // Dựng lại bản chữ thì nút cũ bị thay mất: cho khung trả tiêu điểm về nút mới.
    () => {
      if (panel.openKey) panel.setReturnFocus(textEl.querySelector<HTMLElement>(`[data-open="${CSS.escape(panel.openKey)}"]`));
    },
  );

  onLangChange(() => {
    topbar.relang();
    panel.relang();
  });

  if (room && route.exhibitId) open(`${room.slug}/${route.exhibitId}`);
  installHooks({ mode: 'text', getRoomIndex: () => room?.order ?? 0, getOpenKey: () => panel.openKey, goTo: () => undefined, open });
}
