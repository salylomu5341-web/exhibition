import type { ExhibitOf } from '../content/schema';
import { pickAudio, t } from '../i18n/lang';
import { h, paragraphs } from '../ui/dom';
import { narrationButton } from '../ui/narration';
import type { PanelContent } from '../ui/panel';

export function renderBoard(ex: ExhibitOf<'board'>): PanelContent {
  const narration = narrationButton(() => pickAudio(ex.narration));
  const text = h('div', { class: 'p-text' });
  const update = () => {
    text.replaceChildren(...paragraphs(t(ex.body)));
    narration.update();
  };
  update();
  return { el: h('div', { class: 'p-board' }, narration.el, text), update, dispose: narration.dispose };
}
