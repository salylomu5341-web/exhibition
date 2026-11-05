import '../ui/styles.css';
import '../sheets/sheet.css';
import './print.css';
import { loadBook, loadContent } from '../content/load';
import type { Lang } from '../content/schema';
import { getLang, initLang, onLangChange, setLang, t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { SHEET_PX } from '../book/pages';
import { parseRoute } from '../nav/route';
import { buildSheets } from '../sheets/layout';
import { fitSheet, qrBase, renderSheets } from '../sheets/render';
import { h } from '../ui/dom';

/** Khổ giấy: A3 phóng tờ A4 lên √2 (lấy 1,414 cho chắc không tràn sang tờ thứ hai). */
const PAPERS = { a4: { size: 'A4', zoom: 1 }, a3: { size: 'A3', zoom: 1.414 } } as const;
type Paper = keyof typeof PAPERS;

async function boot(): Promise<void> {
  initLang(parseRoute(location.pathname, location.search).lang);
  const bar = document.getElementById('print-bar')!;
  const main = document.getElementById('sheets')!;
  const [{ site, rooms }, book] = await Promise.all([loadContent(), loadBook()]);
  const { base, sample } = qrBase();

  const pageStyle = h('style', {});
  document.head.append(pageStyle);
  const params = new URLSearchParams(location.search);
  let paper: Paper = params.get('kho') === 'a3' ? 'a3' : 'a4';

  const title = h('h1', {});
  const printBtn = h('button', { type: 'button', class: 'btn' });
  const sizeLabel = h('span', {});
  const size = h('select', {}, h('option', { value: 'a4' }, 'A4'), h('option', { value: 'a3' }, 'A3'));
  size.value = paper;
  const langBtns = (['vi', 'mnong'] as Lang[]).map((lang) => {
    const btn = h('button', { type: 'button' }, lang === 'vi' ? 'Tiếng Việt' : "M'Nông");
    btn.addEventListener('click', () => setLang(lang));
    return { lang, btn };
  });
  const warn = h('p', { class: 'print-warn' });
  warn.hidden = !sample;
  bar.append(
    h('div', { class: 'print-tools' }, title, h('div', { class: 'lang' }, ...langBtns.map((l) => l.btn)), h('label', {}, sizeLabel, size), printBtn),
    warn,
  );
  printBtn.addEventListener('click', () => window.print());

  const applyPaper = () => {
    const { size: name, zoom } = PAPERS[paper];
    pageStyle.textContent = `@page { size: ${name}; margin: 0; }`;
    document.body.style.setProperty('--paper-zoom', String(zoom));
    const url = new URL(location.href);
    if (paper === 'a3') url.searchParams.set('kho', 'a3');
    else url.searchParams.delete('kho');
    history.replaceState(null, '', url);
  };
  size.addEventListener('change', () => {
    paper = size.value === 'a3' ? 'a3' : 'a4';
    applyPaper();
  });
  // Màn hình hẹp: thu cả chồng tờ cho vừa bề ngang (chỉ trên màn hình, khi in thì về đúng khổ).
  const fitScreen = () => document.body.style.setProperty('--screen-zoom', String(Math.min(1, (window.innerWidth - 24) / SHEET_PX)));
  window.addEventListener('resize', fitScreen);

  let rendering = 0;
  const render = async () => {
    const run = ++rendering;
    const lang = getLang();
    const sheets = await renderSheets(buildSheets(rooms, lang), { site, book, rooms, lang, base, lazy: false });
    if (run !== rendering) return;
    document.body.style.setProperty('--screen-zoom', '1');
    main.replaceChildren(...sheets);
    await document.fonts.ready;
    sheets.forEach(fitSheet);
    fitScreen();
  };

  const relang = () => {
    const lang = getLang();
    document.title = `${t(UI.sheetsTitle)} – ${t(site.name)}`;
    title.textContent = t(UI.sheetsTitle);
    printBtn.textContent = `🖨 ${t(UI.printNow)}`;
    sizeLabel.textContent = `${t(UI.paperSize)} `;
    warn.textContent = t(UI.sampleUrl);
    langBtns.forEach((l) => l.btn.setAttribute('aria-pressed', String(l.lang === lang)));
    void render();
  };
  applyPaper();
  relang();
  onLangChange(relang);
}

void boot();
