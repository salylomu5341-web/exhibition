import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { collectMediaPaths } from '../../src/content/media';
import type { Room, Site } from '../../src/content/schema';
import { resolveInside } from '../../scripts/lib/paths';
import { ContentError, readContent } from '../../scripts/lib/read-content';
import { makeRoom, makeRooms, makeSite } from './fixtures';

let root: string;

beforeEach(async () => {
  root = await mkdtemp(path.join(os.tmpdir(), 'trien-lam-'));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function put(rel: string, data: string): Promise<void> {
  const file = path.join(root, rel);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data, 'utf8');
}

const json = (value: unknown) => JSON.stringify(value, null, 2);

async function writeTree(site: Site = makeSite(), rooms: Room[] = makeRooms(), withMedia = true): Promise<void> {
  await put('content/site.json', json(site));
  for (const room of rooms) await put(`content/rooms/${room.id}.json`, json(room));
  if (withMedia) for (const media of collectMediaPaths({ site, rooms })) await put(media, 'x');
}

async function issuesOf(opts: { checkFiles: boolean }): Promise<string[]> {
  try {
    await readContent({ ...opts, root });
  } catch (err) {
    expect(err).toBeInstanceOf(ContentError);
    return (err as ContentError).issues;
  }
  throw new Error('readContent lẽ ra phải ném ContentError');
}

describe('readContent', () => {
  it('đọc cây nội dung hợp lệ, sắp theo order', async () => {
    await writeTree();
    const { site, rooms } = await readContent({ checkFiles: true, root });
    expect(site.rooms).toHaveLength(7);
    expect(rooms.map((r) => r.order)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('báo thiếu file gian', async () => {
    await writeTree();
    await rm(path.join(root, 'content/rooms/03-gian-3.json'));
    const issues = await issuesOf({ checkFiles: false });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('content/rooms/03-gian-3.json');
    expect(issues[0]).toContain('không đọc được');
  });

  it('báo JSON hỏng', async () => {
    await writeTree();
    await put('content/rooms/05-gian-5.json', '{ không phải json');
    const issues = await issuesOf({ checkFiles: false });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain('content/rooms/05-gian-5.json');
  });

  it('gom lỗi schema của nhiều gian vào một ContentError, các gian khác vẫn được đọc', async () => {
    const rooms = makeRooms();
    rooms[1] = { ...rooms[1], order: 99 };
    rooms[2] = { ...rooms[2], slug: 'SAI SLUG' };
    await writeTree(makeSite(), rooms);
    const issues = await issuesOf({ checkFiles: false });
    expect(issues).toHaveLength(2);
    expect(issues.some((i) => i.startsWith('content/rooms/02-gian-2.json') && i.includes('order'))).toBe(true);
    expect(issues.some((i) => i.startsWith('content/rooms/03-gian-3.json') && i.includes('slug'))).toBe(true);
  });

  it('báo id gian khác tên file', async () => {
    await writeTree();
    await put('content/rooms/04-gian-4.json', json(makeRoom(4, { id: 'sai-id' })));
    const issues = await issuesOf({ checkFiles: false });
    expect(issues).toEqual(['content/rooms/04-gian-4.json › id: phải là "04-gian-4" (trùng tên file)']);
  });

  it('báo gian bị liệt kê hai lần trong site.json', async () => {
    const site = makeSite();
    site.rooms[6] = site.rooms[0];
    await writeTree(site);
    const issues = await issuesOf({ checkFiles: false });
    expect(issues.join('\n')).toContain('site.json: gian "01-gian-1" bị liệt kê hai lần');
  });

  it('báo thiếu file media khi checkFiles', async () => {
    await writeTree();
    await rm(path.join(root, 'media/share/gian-2.jpg'));
    await expect(readContent({ checkFiles: false, root })).resolves.toBeDefined();
    const issues = await issuesOf({ checkFiles: true });
    expect(issues).toEqual(['thiếu file public/media/share/gian-2.jpg']);
  });

  it('báo sai chữ hoa/thường của tên file media khi checkFiles', async () => {
    await writeTree();
    await rm(path.join(root, 'media/share/home.jpg'));
    await put('media/share/Home.jpg', 'x');
    const issues = await issuesOf({ checkFiles: true });
    expect(issues).toEqual(['thiếu file public/media/share/home.jpg (kiểm tra chữ hoa/thường)']);
  });

  it('báo sai chữ hoa/thường của tên thư mục media', async () => {
    await writeTree();
    await rm(path.join(root, 'media/share'), { recursive: true });
    await put('media/Share/home.jpg', 'x');
    for (let o = 1; o <= 7; o++) await put(`media/Share/gian-${o}.jpg`, 'x');
    const issues = await issuesOf({ checkFiles: true });
    expect(issues).toHaveLength(8);
    expect(issues.every((i) => i.endsWith('(kiểm tra chữ hoa/thường)'))).toBe(true);
  });

  it('đọc được JSON có BOM UTF-8', async () => {
    await writeTree();
    await put('content/site.json', '\uFEFF' + json(makeSite()));
    await put('content/rooms/01-gian-1.json', '\uFEFF' + json(makeRoom(1)));
    const { rooms } = await readContent({ checkFiles: true, root });
    expect(rooms).toHaveLength(7);
  });
});

describe('readContent từ Supabase', () => {
  beforeEach(() => {
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'khoa-thu');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  const rows = (site: Site) => [{ id: 'site', data: site }, ...makeRooms().map((r) => ({ id: r.id, data: r }))];

  it('dùng nội dung trên Supabase, vẫn kiểm file media trong repo', async () => {
    await writeTree();
    const site = makeSite();
    site.name.vi = 'Tên đã sửa';
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(rows(site)))));
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const content = await readContent({ checkFiles: true, root, remote: true });
    expect(content.site.name.vi).toBe('Tên đã sửa');
  });

  it('Supabase lỗi: đọc file trong repo', async () => {
    await writeTree();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 503 })));
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const content = await readContent({ checkFiles: true, root, remote: true });
    expect(content.site.name.vi).toBe(makeSite().name.vi);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe('resolveInside', () => {
  it('trả về đường dẫn tuyệt đối bên trong thư mục gốc', () => {
    expect(resolveInside(root, '/media/a/b.jpg')).toBe(path.join(root, 'media', 'a', 'b.jpg'));
  });

  it('ném lỗi khi đường dẫn thoát khỏi thư mục gốc', () => {
    expect(() => resolveInside(root, '/media/../../x.jpg')).toThrow(/ngoài/);
    expect(() => resolveInside(root, '/../x.jpg')).toThrow(/ngoài/);
  });
});
