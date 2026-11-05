/**
 * Tải nội dung đã sửa ở trang quản trị (Supabase) về `public/content/`, để repo và bản dự phòng khớp với web.
 * Cần SUPABASE_SERVICE_ROLE_KEY trong `.env.local`.
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { rowsToContent } from '../src/content/remote';
import { readRows } from '../server/supabase';
import { loadLocalEnv } from './lib/env';
import { PUBLIC_DIR } from './lib/paths';

loadLocalEnv();
const { site, rooms } = rowsToContent(await readRows(process.env));
const write = (rel: string, data: unknown) => writeFile(path.join(PUBLIC_DIR, rel), `${JSON.stringify(data, null, 2)}\n`, 'utf8');
await write('content/site.json', site);
for (const room of rooms) await write(`content/rooms/${room.id}.json`, room);
console.log(`Đã tải ${rooms.length + 1} file nội dung từ Supabase về public/content/.`);
