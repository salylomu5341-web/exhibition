import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { BOOK_PATH, bookPath } from '../book/pages';
import { roomPath } from '../nav/route';
import { buildSheets, roomStarts, roomText } from '../sheets/layout';
import { textBlocks } from '../util/text';
import { esc } from './escape';
import type { Book, Exhibit, Lang, Room, Site } from './schema';

function paras(text: string): string {
  return textBlocks(text)
    .map((b) => (b.heading ? `<h3>${esc(b.text)}</h3>` : `<p>${esc(b.text)}</p>`))
    .join('');
}

function exhibitBody(ex: Exhibit, lang: Lang): string {
  switch (ex.type) {
    case 'board':
      return paras(t(ex.body, lang));
    case 'gallery':
      return ex.images
        .map((img) => `<figure><img src="${esc(img.src)}" alt="${esc(t(img.alt, lang))}" loading="lazy" />${img.caption ? `<figcaption>${esc(t(img.caption, lang))}</figcaption>` : ''}</figure>`)
        .join('');
    case 'video':
      return `<p><a href="https://www.youtube.com/watch?v=${esc(ex.youtubeId)}" rel="noopener" target="_blank">${esc(t(ex.title, lang))} (YouTube)</a></p>`;
    case 'gongs':
      return `<ul>${ex.gongs.map((g) => `<li>${esc(t(g.name, lang))}</li>`).join('')}</ul>`;
    case 'ar':
      return paras(t(ex.body, lang));
    case 'costume':
      return `<ul>${ex.costumes.map((c) => `<li>${esc(t(c.name, lang))}</li>`).join('')}</ul>`;
    case 'quiz':
      return `<p>${esc(t(UI.quizCount, lang).replace('{n}', String(ex.questions.length)))}</p>`;
  }
}

function exhibitSection(room: Room, ex: Exhibit, lang: Lang): string {
  return (
    `<section id="hv-${esc(ex.id)}"><h2 id="h-${esc(ex.id)}">${esc(t(ex.title, lang))}</h2>${exhibitBody(ex, lang)}` +
    `<p><button type="button" class="btn open-exhibit" aria-describedby="h-${esc(ex.id)}" data-open="${esc(`${room.slug}/${ex.id}`)}">${esc(t(UI.open, lang))}</button></p></section>`
  );
}

function roomNav(rooms: Room[], lang: Lang): string {
  const label = esc(t(UI.roomList, lang));
  const items = rooms.map((r) => `<li><a href="${roomPath(r.slug)}">${r.order}. ${esc(t(r.name, lang))}</a></li>`).join('');
  return `<footer><nav aria-label="${label}"><h2>${label}</h2><ul>${items}</ul></nav></footer>`;
}

export function renderHomeText(site: Site, rooms: Room[], lang: Lang): string {
  return (
    `<article><h1>${esc(t(site.name, lang))}</h1>${paras(t(site.welcome, lang))}` +
    `<p><a class="btn secondary" href="${BOOK_PATH}">${esc(t(UI.readBook, lang))}</a></p></article>${roomNav(rooms, lang)}`
  );
}

export function renderRoomText(site: Site, rooms: Room[], room: Room, lang: Lang): string {
  return (
    `<article><p class="note"><a href="/">${esc(t(site.name, lang))}</a></p>` +
    `<h1>${esc(t(room.name, lang))}</h1>${paras(t(room.intro, lang))}` +
    `${room.exhibits.map((ex) => exhibitSection(room, ex, lang)).join('')}</article>${roomNav(rooms, lang)}`
  );
}

/** Bản chữ của sách: lời giới thiệu từng gian (đúng nội dung các tờ), kèm link tới trang sách và gian 3D. */
export function renderBookText(site: Site, rooms: Room[], book: Book, lang: Lang): string {
  const starts = roomStarts(buildSheets(rooms, lang));
  const sections = rooms
    .map((room) => {
      const page = starts.get(room.slug) ?? 0;
      return (
        `<section><h2>${esc(t(room.name, lang))}</h2>${paras(roomText(room, lang))}` +
        `<p><a href="${bookPath(page)}">${esc(t(UI.page, lang))} ${page + 1}</a> · <a href="${roomPath(room.slug)}">${esc(t(UI.toExhibition, lang))}</a></p></section>`
      );
    })
    .join('');
  return (
    `<article><p class="note"><a href="/">${esc(t(site.name, lang))}</a></p>` +
    `<h1>${esc(t(book.title, lang))}</h1>${paras(t(book.intro, lang))}${sections}` +
    `<p><a class="btn secondary" href="/">${esc(t(UI.toExhibition, lang))}</a></p></article>${roomNav(rooms, lang)}`
  );
}
