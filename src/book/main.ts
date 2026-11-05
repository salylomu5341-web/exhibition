import '../ui/styles.css';
import '../sheets/sheet.css';
import './book.css';
import { loadBook, loadContent } from '../content/load';
import { initLang, t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { parseRoute } from '../nav/route';
import { startBook } from './app';

async function boot(): Promise<void> {
  initLang(parseRoute(location.pathname, location.search).lang);
  const stageEl = document.getElementById('book-stage')!;
  const uiEl = document.getElementById('ui')!;
  const textEl = document.getElementById('text-version')!;

  try {
    const [{ site, rooms }, book] = await Promise.all([loadContent(), loadBook()]);
    await startBook(site, rooms, book, stageEl, uiEl);
  } catch (err) {
    console.error(err);
    stageEl.hidden = true;
    document.body.classList.remove('mode-book');
    document.body.classList.add('mode-text');
    textEl.insertAdjacentHTML('afterbegin', `<p class="note">${t(UI.bookLoadError)}</p>`);
  }
}

void boot();
