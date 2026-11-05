# Trang quản trị nội dung (`/admin/`) với Supabase

> **Cập nhật khi làm (bản cuối):** web và trang quản trị không gọi Supabase trực tiếp (dự án dùng chung khoá quyền của khách). Ba hàm Vercel: `GET /api/content` (đọc bảng `mnong_content`, CDN giữ 10 giây), `POST /api/admin/login`, `POST /api/admin/save` (kiểm schema rồi ghi bằng `SUPABASE_SERVICE_ROLE_KEY`). Đăng nhập bằng `ADMIN_USERNAME`/`ADMIN_PASSWORD` trong biến môi trường Vercel; trang nhớ trong phiên và gửi kèm mỗi lần lưu. Code dùng chung ở `server/`. `supabase/mnong.sql` chỉ còn bảng nội dung, bảng lịch sử và trigger. Phần dưới là thiết kế ban đầu.

Chủ dự án muốn tự sửa video YouTube, chữ giới thiệu và câu hỏi trắc nghiệm mà không cần nhờ lập trình. Chỉ một người dùng. Đây là mục "Trang quản trị nội dung (giai đoạn sau)" trong thiết kế gốc.

## Quyết định

- Nội dung sửa được lưu trên **Supabase**, dùng chung dự án với `website-susu` (`https://mlnajumxijnertmgieeh.supabase.co`). Bảng của triển lãm có tiền tố `mnong_`, không đụng bảng `susu_`.
- Khách mở web là đọc nội dung từ Supabase, nên **sửa xong là thấy ngay**, không chờ build.
- Web luôn có bản dự phòng: các file `public/content/*.json` trong repo. Supabase lỗi, chậm hoặc dữ liệu hỏng thì web dùng bản này, không trắng trang.
- Đăng nhập bằng **Supabase Auth** (email + mật khẩu). Chỉ email có trong bảng `mnong_admins` mới được ghi.
- Chỉ dùng **URL dự án và anon key** (công khai, vốn nằm trong mã JS gửi cho trình duyệt). Không dùng service role key. Hai giá trị này ghi thẳng trong `supabase.config.ts` của repo, nên không cần đặt biến môi trường trên Vercel.
- Không sửa ảnh, âm thanh, mô hình, vị trí hiện vật, `id`/`slug`/`order` (giữ mã QR đã in). Không sửa SEO, `book.json` (sách vẫn đọc file trong repo).

## Những gì sửa được

| Nơi | Trường |
| --- | --- |
| `site` | `name`, `welcome`, `introVideo` (được bỏ trống) |
| Mỗi gian | `name`, `intro` |
| Mọi hiện vật | `title` |
| `board`, `ar` | `body` |
| `video` | `youtubeId` |
| `gongs` | `gongs[i].name` |
| `costume` | `costumes[i].name` |
| `quiz` | toàn bộ `questions` (thêm, xoá, đổi thứ tự, sửa câu, 4 đáp án, `answer`, `explain`) |

Mọi chữ là cặp `{ vi, mnong }`, cả hai bắt buộc (như schema hiện có).

## Supabase

File `supabase/mnong.sql` trong repo (chạy được nhiều lần không lỗi):

- `mnong_content (id text primary key, data jsonb not null, updated_at timestamptz not null default now(), updated_by text)`: 8 dòng, `id` là `site` và tên file gian (`01-cong-chieng` … `07-trac-nghiem`), `data` đúng nội dung file JSON tương ứng.
- `mnong_content_history (id bigserial primary key, content_id text not null, data jsonb not null, saved_at timestamptz not null default now(), saved_by text)`: trigger `before update` trên `mnong_content` chép bản cũ vào đây. Khôi phục = chép `data` của dòng lịch sử về lại `mnong_content`.
- `mnong_admins (email text primary key)`: danh sách email được ghi.
- Hàm `mnong_is_admin()` (`security definer`): `auth.jwt() ->> 'email'` có trong `mnong_admins`.
- RLS bật trên cả ba bảng:
  - `mnong_content`: ai cũng `select`; `insert`/`update` khi `mnong_is_admin()`; không cho `delete`.
  - `mnong_content_history`: `select` khi `mnong_is_admin()`; chỉ trigger ghi vào.
  - `mnong_admins`: không có policy (chỉ sửa trong SQL Editor).
- Hàm `mnong_save(changes jsonb)` (`security invoker`, chạy trong một giao dịch): `changes` là mảng `{ id, data, version }` với `version` = `updated_at` lúc tải. Dòng nào `updated_at` đã khác thì huỷ cả lần lưu và báo trùng phiên bản (mã lỗi riêng); không thì cập nhật hết, đặt `updated_at = now()`, `updated_by = email`. Dòng chưa có (lần đầu) thì thêm mới. Không phải admin thì RLS chặn.

## Web đọc nội dung

- `supabase.config.ts` (gốc repo): `SUPABASE_URL`, `SUPABASE_ANON_KEY`.
- `src/content/load.ts` → `loadContent()`:
  1. Gọi REST `GET {url}/rest/v1/mnong_content?select=id,data` (header `apikey`), quá 3 giây thì bỏ. Dùng `fetch`, không kéo `supabase-js` vào trang chính.
  2. Có đủ 8 dòng, qua `SiteSchema`/`RoomSchema` và `validateContent` → dùng.
  3. Thiếu, lỗi hay không hợp lệ → đọc `public/content/*.json` như hiện nay, ghi `console.warn`.
- Áp dụng cho trang 3D (`/`) và tờ in, sách (`/in/`, `/sach/`) vì cùng gọi `loadContent()`.
- Lúc build (`scripts/lib/read-content.ts`, dùng bởi `build-pages`, `check:content`, `qr`): lấy từ Supabase theo cùng quy tắc, lỗi thì dùng file trong repo và in cảnh báo. Thẻ SEO, bản chữ cho Google và sitemap vì thế cập nhật ở lần build kế tiếp.
- `npm run content:pull`: tải 8 dòng về ghi đè `public/content/site.json` và `public/content/rooms/*.json` (định dạng `JSON.stringify(data, null, 2) + "\n"`), để repo và bản dự phòng luôn khớp Supabase.

## Trang quản trị

- `admin/index.html`: trang thứ tư trong `rollupOptions.input`; `<meta name="robots" content="noindex, nofollow">`, tiêu đề "Quản trị nội dung – Triển lãm M'Nông". Không vào sitemap; `robots.txt` đã có `Disallow: /admin`.
- `src/admin/` (DOM thuần với `h()` từ `src/ui/dom.ts`; riêng trang này dùng `@supabase/supabase-js` cho đăng nhập, giữ phiên, gọi `mnong_save`):
  - `main.ts`: đăng nhập, tải nội dung, điều hướng mục, lưu.
  - `forms.ts`: dựng form từng mục, ghi vào bản nháp.
  - `youtube.ts` (hàm thuần): `parseYoutubeId(input): string | null`.
  - `editable.ts` (hàm thuần): `lockedShape(id, data)` bỏ các trường sửa được (bảng trên) và trả phần còn lại; trước khi lưu, phần khoá của bản nháp phải bằng sâu bản đã tải.
  - `admin.css`.

### Giao diện

- **Đăng nhập:** email, mật khẩu, nút "Đăng nhập". Sai thì báo "Sai email hoặc mật khẩu". Đăng nhập được nhưng email không có quyền thì báo "Tài khoản này chưa được cấp quyền sửa" và đăng xuất.
- **Lần đầu (bảng trống):** thay cho form là nút "Đưa nội dung hiện tại lên Supabase": đọc 8 file JSON đang có trên web, gọi `mnong_save`.
- **Bố cục:** cột trái (điện thoại: thanh chọn ở trên) gồm "Thông tin chung", "Gian 1 … Gian 7" (kèm tên gian), "Trắc nghiệm". Bên phải là form của mục đang chọn.
- **Ô chữ song ngữ:** hai ô cạnh nhau (điện thoại: chồng lên nhau) "Tiếng Việt" / "Tiếng M'Nông". Bài dài là `textarea` tự cao theo chữ, kèm ghi chú: dòng bắt đầu `## ` là tiêu đề nhỏ, dòng trống để tách đoạn.
- **Video:** ô "Link YouTube" nhận `youtu.be/ID`, `youtube.com/watch?v=ID`, `youtube.com/shorts/ID`, `youtube.com/embed/ID`, `youtube-nocookie.com/embed/ID` hoặc mã 11 ký tự; bên cạnh là ảnh `https://i.ytimg.com/vi/<ID>/hqdefault.jpg`. Link không đọc được thì báo lỗi ngay ô đó.
- **Hiện vật không sửa được nội dung** (khung ảnh, chiêng, AR, trang phục): thẻ chỉ có tiêu đề (và tên chiêng / tên bộ trang phục), ghi loại hiện vật.
- **Trắc nghiệm:** mỗi câu một thẻ "Câu N": câu hỏi, 4 đáp án (mỗi đáp án một nút chọn "Đáp án đúng"), giải thích; nút "Lên", "Xuống", "Xoá câu". Cuối danh sách: "Thêm câu hỏi" (câu mới chữ trống, đáp án đúng là A). Còn 1 câu thì không cho xoá.
- **Thanh lưu** dính ở cuối màn hình: "Lưu thay đổi" (chỉ bật khi có thay đổi) và dòng trạng thái. Trước khi gửi kiểm bằng `SiteSchema`/`RoomSchema`, `validateContent` và `lockedShape`; lỗi nào tô đỏ ô đó, nhảy tới ô lỗi đầu tiên, báo "Còn N chỗ cần sửa". Chỉ gửi những dòng có thay đổi.
- Sau khi lưu: "Đã lưu. Mở lại web là thấy nội dung mới."
- Nút "Đăng xuất" và link "Xem web" (mở trang chủ ở thẻ mới).
- Rời trang khi còn thay đổi chưa lưu: trình duyệt hỏi lại (`beforeunload`).

## Lỗi và thông báo

| Tình huống | Trang hiện |
| --- | --- |
| Sai email/mật khẩu | "Sai email hoặc mật khẩu" |
| Không có quyền ghi | "Tài khoản này chưa được cấp quyền sửa" |
| Hết phiên giữa chừng | Màn đăng nhập, giữ bản nháp; đăng nhập lại rồi lưu tiếp |
| Nội dung không hợp lệ | Tô đỏ các ô, không gửi |
| Trùng phiên bản | "Nội dung vừa được cập nhật ở nơi khác. Bấm Tải lại để lấy bản mới (phần đang sửa sẽ mất)." + nút "Tải lại" |
| Mạng / Supabase lỗi | "Không lưu được, thử lại sau ít phút"; bản nháp giữ nguyên |

## Cài đặt (một lần)

- Chạy `supabase/mnong.sql` trên dự án Supabase dùng chung (Claude chạy bằng chuỗi kết nối trong `website-susu/.env.local` sau khi chủ dự án đồng ý, hoặc chủ dự án dán vào SQL Editor), kèm thêm email quản trị vào `mnong_admins`.
- Chủ dự án tự tạo tài khoản đăng nhập: Supabase → Authentication → Users → Add user (email đó, mật khẩu tự đặt, tick "Auto confirm").
- Đăng nhập `/admin/`, bấm "Đưa nội dung hiện tại lên Supabase".
- Hướng dẫn ghi vào `docs/HUONG-DAN-NOI-DUNG.md`, kèm cách khôi phục bản cũ từ `mnong_content_history` và lưu ý: gói miễn phí tạm dừng dự án sau một tuần không hoạt động (web vẫn chạy bằng bản dự phòng; vào Supabase bấm "Restore").

## Test

- Unit:
  - `parseYoutubeId`: đủ các dạng link, có tham số thừa (`?si=…`, `&t=30`), link sai.
  - `lockedShape`: sửa trường cho phép → khớp; đổi `slug`, `position`, ảnh, thêm/bớt hiện vật → không khớp.
  - `loadContent`: Supabase trả đủ và hợp lệ → dùng; thiếu dòng, sai schema, lỗi mạng, quá 3 giây → dùng file dự phòng (`fetch` giả).
  - `read-content` lúc build: như trên.
- e2e: chặn `*.supabase.co` bằng `page.route`:
  - Trả nội dung có một tên gian đã đổi → trang 3D hiện tên mới.
  - Trả lỗi → web vẫn chạy bằng bản dự phòng (các test cũ giữ nguyên).
  - Trang quản trị với Auth và `mnong_save` giả: đăng nhập, đổi video gian 5 bằng link `youtu.be`, sửa đáp án đúng câu 1, lưu, kiểm thân yêu cầu gửi đi đúng; ô bỏ trống thì không gửi và tô đỏ.
- Kiểm thật một lần trên dự án Supabase sau khi cài: đọc, lưu, lịch sử, tài khoản không có quyền bị chặn.

## Ngoài phạm vi

- Tải ảnh, thay âm thanh, mô hình 3D.
- Nhiều tài khoản phân quyền, giao diện xem lịch sử và nút hoàn tác.
- Sửa SEO, `book.json`, thêm/bớt hiện vật hay gian.
- Kiểm tra phần khoá ở phía Supabase (chỉ kiểm ở trang quản trị; người ghi duy nhất là chủ dự án, và web có bản dự phòng nếu dữ liệu hỏng).
