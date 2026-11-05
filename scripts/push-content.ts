/**
 * Đẩy nội dung trong `public/content/` lên Supabase (ghi đè), dùng khi đổi những thứ trang quản trị không sửa được
 * (ảnh, hiện vật mới...). Nên chạy `npm run content:pull` trước khi sửa file để không mất phần đã sửa trên web.
 * Cần SUPABASE_SERVICE_ROLE_KEY trong `.env.local`.
 */
import { SITE_ROW } from '../src/content/remote';
import { upsertRows } from '../server/supabase';
import { loadLocalEnv } from './lib/env';
import { readContent } from './lib/read-content';

loadLocalEnv();
const { site, rooms } = await readContent({ checkFiles: true });
await upsertRows(process.env, [{ id: SITE_ROW, data: site }, ...rooms.map((r) => ({ id: r.id, data: r }))]);
console.log(`Đã đẩy ${rooms.length + 1} file nội dung lên Supabase.`);
