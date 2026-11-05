import './ui/styles.css';
import { startExhibition } from './app/exhibition';
import { startFallback } from './app/fallback';
import { loadContent } from './content/load';
import { initLang, t } from './i18n/lang';
import { UI } from './i18n/ui-strings';
import { parseRoute } from './nav/route';
import { hasWebGL } from './scene/renderer';

async function boot(): Promise<void> {
  const route = parseRoute(location.pathname, location.search);
  initLang(route.lang);
  const stageEl = document.getElementById('stage')!;
  const uiEl = document.getElementById('ui')!;
  const textEl = document.getElementById('text-version')!;

  let content;
  try {
    content = await loadContent();
  } catch (err) {
    console.error(err);
    document.body.classList.add('mode-text');
    textEl.insertAdjacentHTML('afterbegin', `<p class="note">${t(UI.loadError)}</p>`);
    return;
  }

  if (hasWebGL()) {
    try {
      startExhibition(content.site, content.rooms, route, stageEl, uiEl, textEl);
      return;
    } catch (err) {
      console.error('Không khởi tạo được cảnh 3D', err);
      stageEl.replaceChildren();
      uiEl.replaceChildren();
    }
  }
  startFallback(content.site, content.rooms, route, uiEl, textEl);
}

void boot();
