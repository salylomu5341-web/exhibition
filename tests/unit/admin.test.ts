import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseYoutubeId } from '../../src/admin/youtube';
import { loadContent } from '../../src/content/load';
import { rowsToContent, type ContentRow } from '../../src/content/remote';
import { remoteWanted } from '../../scripts/lib/read-content';
import { makeRoom, makeRooms, makeSite } from './fixtures';

const rowsOf = (site = makeSite(), rooms = makeRooms()): ContentRow[] => [
  { id: 'site', data: site },
  ...rooms.map((r) => ({ id: r.id, data: r })),
];

describe('parseYoutubeId', () => {
  it.each([
    ['zwGYCGWBP_g', 'zwGYCGWBP_g'],
    ['https://youtu.be/zwGYCGWBP_g', 'zwGYCGWBP_g'],
    ['https://youtu.be/zwGYCGWBP_g?si=abc', 'zwGYCGWBP_g'],
    ['https://www.youtube.com/watch?v=zwGYCGWBP_g&t=30', 'zwGYCGWBP_g'],
    ['youtube.com/watch?v=zwGYCGWBP_g', 'zwGYCGWBP_g'],
    ['https://m.youtube.com/watch?v=zwGYCGWBP_g', 'zwGYCGWBP_g'],
    ['https://youtube.com/shorts/eWIFxO0Jle4?feature=share', 'eWIFxO0Jle4'],
    ['https://www.youtube.com/embed/zwGYCGWBP_g', 'zwGYCGWBP_g'],
    ['https://www.youtube-nocookie.com/embed/zwGYCGWBP_g?autoplay=1', 'zwGYCGWBP_g'],
    ['  https://youtu.be/zwGYCGWBP_g  ', 'zwGYCGWBP_g'],
  ])('%s → %s', (input, id) => {
    expect(parseYoutubeId(input)).toBe(id);
  });
  it.each(['', 'abc', 'https://vimeo.com/123456789', 'https://youtu.be/short', 'https://youtube.com/channel/zwGYCGWBP_g'])('"%s" không đọc được', (input) => {
    expect(parseYoutubeId(input)).toBeNull();
  });
});

describe('rowsToContent', () => {
  it('đủ dòng, hợp lệ: trả nội dung sắp theo order', () => {
    const rows = rowsOf().reverse();
    const { site, rooms } = rowsToContent(rows);
    expect(site.rooms).toHaveLength(7);
    expect(rooms.map((r) => r.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
  it('thiếu dòng gian thì báo lỗi', () => {
    expect(() => rowsToContent(rowsOf().slice(0, 7))).toThrow(/thiếu dòng/);
  });
  it('nội dung sai schema thì báo lỗi', () => {
    const rooms = makeRooms();
    rooms[2] = makeRoom(3, { name: { vi: '', mnong: 'x' } });
    expect(() => rowsToContent(rowsOf(makeSite(), rooms))).toThrow();
  });
  it('không có dòng site thì báo lỗi', () => {
    expect(() => rowsToContent([])).toThrow();
  });
});

describe('loadContent', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  /** /api/content trả `remote`; file trong repo trả nội dung mẫu. */
  function stubFetch(remote: () => Promise<Response>) {
    const site = makeSite();
    const local = new Map<string, unknown>([['/content/site.json', site], ...makeRooms().map((r): [string, unknown] => [`/content/rooms/${r.id}.json`, r])]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => (url === '/api/content' ? remote() : new Response(JSON.stringify(local.get(url)), { status: local.has(url) ? 200 : 404 }))),
    );
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  }

  it('dùng nội dung trên Supabase khi hợp lệ', async () => {
    const site = makeSite();
    site.name.vi = 'Tên mới từ trang quản trị';
    stubFetch(async () => new Response(JSON.stringify(rowsOf(site))));
    expect((await loadContent()).site.name.vi).toBe('Tên mới từ trang quản trị');
  });
  it('Supabase lỗi: dùng bản trong repo', async () => {
    stubFetch(async () => new Response('{}', { status: 500 }));
    expect((await loadContent()).site.name.vi).toBe(makeSite().name.vi);
    expect(console.warn).toHaveBeenCalled();
  });
  it('Supabase trả nội dung hỏng: dùng bản trong repo', async () => {
    stubFetch(async () => new Response(JSON.stringify(rowsOf().slice(0, 3))));
    expect((await loadContent()).rooms).toHaveLength(7);
  });
  it('mất mạng: dùng bản trong repo', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    expect((await loadContent()).rooms).toHaveLength(7);
  });
});

describe('remoteWanted', () => {
  it('build trên Vercel thì lấy từ Supabase, trên máy thì không', () => {
    expect(remoteWanted({ VERCEL: '1' })).toBe(true);
    expect(remoteWanted({})).toBe(false);
    expect(remoteWanted({ CONTENT_SOURCE: 'supabase' })).toBe(true);
    expect(remoteWanted({ VERCEL: '1', CONTENT_SOURCE: 'local' })).toBe(false);
  });
});

describe('applyUiTranslations', () => {
  it('ô có bản dịch thì dùng, ô trống hay thiếu thì về tiếng Việt', async () => {
    const { UI, applyUiTranslations } = await import('../../src/i18n/ui-strings');
    applyUiTranslations({ enter: 'Lăp hiu', skipIntro: '   ' });
    expect(UI.enter.mnong).toBe('Lăp hiu');
    expect(UI.skipIntro.mnong).toBe(UI.skipIntro.vi);
    applyUiTranslations(undefined);
    expect(UI.enter.mnong).toBe(UI.enter.vi);
  });
});
