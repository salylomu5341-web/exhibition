import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';
import type { PanelCtx } from './types';

export function renderGongs(ex: ExhibitOf<'gongs'>, ctx: PanelCtx): PanelContent {
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
