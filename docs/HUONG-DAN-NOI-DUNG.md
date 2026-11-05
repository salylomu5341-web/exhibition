# Hướng dẫn thay nội dung triển lãm

Video, chữ giới thiệu và câu hỏi trắc nghiệm sửa ngay trên web ở trang quản trị `/admin/` (mục 10). Những thứ còn lại (ảnh, âm thanh, mô hình, thêm hiện vật) nằm trong thư mục `public/`, sửa theo các mục dưới đây. Không cần sửa code.

**Triển lãm luôn có đúng 7 gian.** Bạn thêm được nội dung vào các gian có sẵn (mỗi gian có 6 chỗ trên vách; gian 5 đã đầy), nhưng không thêm được gian mới.

**Sau khi đã in mã QR, tuyệt đối không đổi `slug` của gian và `id` của hiện vật.** Mã QR trỏ tới các giá trị này; đổi đi thì mọi mã đã in sẽ hỏng. Đổi chữ hiển thị (tên, mô tả) thì không sao.

**Giữ tên ngắn.** Tên gian, tên hiện vật hiện trên bảng 3D và bị cắt nếu quá dài. Tên gian nên không quá 30 ký tự.

## 1. Chữ giới thiệu (tiếng Việt và tiếng M'Nông)

- Trang chủ và lời chào ở sảnh: `public/content/site.json`
- Mỗi gian một file: `public/content/rooms/01-cong-chieng.json` … `07-trac-nghiem.json`
- Mọi chữ có dạng `{ "vi": "…", "mnong": "…" }`. Thay chữ `[M'Nông] …` bằng bản dịch thật.
- Xuống dòng hai lần (`\n\n`) để tách đoạn.
- Muốn một đoạn thành tiêu đề nhỏ (ví dụ "1. Khái quát"), viết `## ` ở đầu đoạn: `"## 1. Khái quát\n\nĐoạn văn…"`. Bảng tóm tắt trên vách 3D bỏ qua các tiêu đề này.

## 2. Ảnh

- Đặt ảnh vào `public/media/<tên-gian>/`, ví dụ `public/media/le-cau-mua/anh-1.jpg`.
- Thay một ảnh bằng ảnh mới: giữ nguyên tên file cũng được. Server luôn hỏi lại trước khi dùng ảnh đã nhớ (cấu hình `no-cache` trong `deploy/nginx.conf.example`), nên khách thấy ảnh mới ngay mà không cần đổi tên. Đây cũng là cách thay âm thanh.
- Có thể ghi đè đúng tên file ảnh mẫu, hoặc thêm ảnh mới vào mục `images` của hiện vật `gallery`:
  `{ "src": "/media/le-cau-mua/anh-5.jpg", "alt": { "vi": "Mô tả ảnh", "mnong": "…" } }`
- Ảnh nên rộng tối đa 1600px, dạng JPG.
- Ảnh chia sẻ Facebook/Zalo: `public/media/share/*.jpg`, đúng 1200×630, JPG.
- **Quy tắc đặt tên file và đường dẫn** (áp dụng cho mọi ảnh, âm thanh, mô hình): đường dẫn trong JSON bắt đầu bằng `/media/`; tên file chỉ gồm chữ thường không dấu, số, `-`, `_`, `.`; đuôi file viết thường (`.jpg`, không phải `.JPG`); không có dấu cách hay chữ có dấu. Sai quy tắc thì `npm run check:content` báo lỗi. Lệnh này cũng kiểm tra tên file trên ổ đĩa khớp đúng chữ hoa/thường với JSON (máy Windows không phân biệt, server Linux có phân biệt).

## 3. Video YouTube

- Đăng video ở chế độ **Không công khai (Unlisted)** — không chọn **Riêng tư (Private)**, vì video riêng tư không phát được trên website — và để bật cho phép nhúng video lên website khác.
- Link `https://www.youtube.com/watch?v=AbCdEfGhIjK` → `youtubeId` là `AbCdEfGhIjK` (11 ký tự).
- Video giới thiệu (phát toàn màn hình khi khách bấm "Vào nhà dài", có nút "Bỏ qua"): sửa `"introVideo"` trong `public/content/site.json`. Xoá dòng này thì khách vào thẳng nhà dài.

## 4. Âm thanh

- 6 tiếng chiêng: `public/media/cong-chieng/chieng-1.mp4` … `chieng-6.mp4` (đoạn ngắn tiếng gõ; dùng được `.mp4`, `.m4a`, `.mp3`, `.wav`, nhớ sửa đuôi trong JSON).
- Thuyết minh: thêm `"narration": { "vi": "/media/…/tm-vi.mp3", "mnong": "/media/…/tm-mnong.mp3" }` vào hiện vật `board`. Thiếu ngôn ngữ nào thì nút nghe tự ẩn ở ngôn ngữ đó.

## 5. Trang phục để chụp ảnh

- Ảnh trang phục (`overlay`) bắt buộc là **PNG nền trong suốt** (đuôi `.png`); `check:content` báo lỗi nếu là JPG. Ảnh nhỏ (`thumb`) thì dùng JPG hay PNG đều được.
- Mỗi bộ cần một ảnh PNG nền trong suốt, tỉ lệ 3:4 (ví dụ 900×1200), chụp cả người: vòng đặt mặt nằm ở trên cùng (cách mép trên 6%, rộng 13% khung, tức cằm ở khoảng y = 228 trên khung 900×1200), áo bắt đầu ngay dưới cằm, khố/váy nối bên dưới. Kèm một ảnh nhỏ 300×400.
- Khai báo trong mục `costumes` của hiện vật `costume` ở `06-trang-phuc.json`.

## 6. Mô hình 3D cho AR

- Thêm hiện vật `ar` với `glb` (Android, máy tính) và `usdz` (iPhone).
- Chiêng mẫu 3D hiện dựng từ ảnh `poster` (ảnh vuông, mặt chiêng tròn vừa khít khung): đổi ảnh poster rồi chạy `npm run gong-model` để làm lại file `glb`. Có mô hình quét 3D thật thì chỉ cần chép đè file `glb`, không chạy lệnh này nữa.
- Mỗi gian có 6 chỗ trên vách (gian 5 đã đầy): `"position": { "wall": "left" | "right", "slot": 0 | 1 | 2 }`, không trùng nhau.

## 7. Câu hỏi trắc nghiệm

- `07-trac-nghiem.json`, mục `questions`. Mỗi câu 4 đáp án; `answer` là số thứ tự đáp án đúng, đếm từ 0.

## 8. Tờ in theo gian (`/in/`) và Sách 3D lật (`/sach/`)

Mỗi gian có một hoặc vài tờ A4: lời giới thiệu của gian, ảnh xung quanh, và mã QR dẫn vào đúng gian đó trong nhà dài 3D. Sách 3D lật dùng chính các tờ này làm trang: bìa, các gian theo thứ tự, trang cuối có mã QR về trang chủ. **Không cần sửa gì riêng cho tờ in hay cho sách**: sửa nội dung gian là cả hai tự đổi theo.

- **Chữ trên tờ:** phần `body` của hiện vật `board` có `id` là `gioi-thieu` trong file của gian. Gian không có hiện vật này thì dùng `intro` của gian. Tiêu đề nhỏ `## ` giữ nguyên (xem mục 1).
- **Chia tờ:** bài dài tự sang tờ thứ hai, thứ ba, chia theo đoạn văn, không cắt giữa đoạn. Mỗi tờ đều có mã QR. Chữ tự thu nhỏ một chút nếu chưa vừa tờ. Một đoạn quá dài (trên khoảng 2.000 chữ) thì nên tách làm hai đoạn.
- **Ảnh trên tờ:** lấy theo thứ tự từ các hiện vật `gallery` của gian. Tờ đầu 3 ảnh, mỗi tờ sau 1 ảnh tiếp theo. Gian không có `gallery` thì tờ chỉ có chữ.
- **Bìa sách:** đặt ảnh bìa (tỉ lệ A4 đứng, ví dụ 1240×1754, JPG) vào `public/media/sach/`, rồi ghi vào `public/content/book.json`: `"cover": "/media/sach/bia.jpg"`. Không có dòng này thì sách dùng bìa chữ (tên triển lãm, `title` và `intro` của sách).
- **Thông tin sách** trong `book.json`: `title` (tên sách), `intro` (giới thiệu ngắn trên bìa chữ), `seo` (tiêu đề, mô tả, ảnh khi chia sẻ).
- **In:** mở `https://<tên-miền>/in/`, chọn tiếng Việt hoặc M'Nông, chọn khổ giấy A4 hoặc A3, bấm "In / lưu PDF". Trong hộp thoại in của Chrome, để lề "Không" và bật "Đồ hoạ nền". Trang `/in/` không xuất hiện trên Google.
- Mã QR trên tờ lấy tên miền thật lúc build. Nếu trang `/in/` hiện băng đỏ "MẪU – KHÔNG IN" thì web chưa có tên miền thật: không in các tờ đó.
- **Link tới một trang sách:** `/sach/?trang=12`. Mã QR của sách nằm cùng bảng in với các mã khác (`npm run qr`).

## 9. Kiểm tra và đưa lên

```bash
npm run check:content
npm run build
npm run qr
```

- `check:content` báo rõ file và trường bị sai, thiếu file ảnh/âm thanh.
- Trước khi `build` và `qr`, điền tên miền thật vào `SITE_URL` trong `site.config.ts` (hoặc đặt biến môi trường `SITE_URL`). Khi còn là giá trị mẫu (`https://example.com`), `npm run build` và `npm run qr` từ chối chạy. Riêng khi build trên Vercel, web tự dùng tên miền production của dự án Vercel.
- `build` tạo thư mục `dist/`; chép toàn bộ `dist/` lên server.
- `qr` tạo mã QR trong `qr/`, mở `qr/index.html` để in.
- Chưa có tên miền mà muốn xem thử:
  - `npm run build:preview` dựng bản `dist/` với tên miền mẫu (chỉ để xem thử, không đưa lên server thật).
  - `npm run qr:preview` tạo mã QR thử, có băng chữ "MẪU – KHÔNG IN". Không in các mã này.
- Thêm hiện vật mới mà chưa có ảnh: chạy `npm run assets` để tạo ảnh mẫu tạm.

## 10. Trang quản trị (`/admin/`)

Nội dung sửa ở đây lưu trên Supabase (dùng chung dự án với website-susu, bảng `mnong_content`). Web đọc qua hàm `/api/content` của Vercel; sửa xong khoảng 10 giây sau khách tải lại web là thấy. Supabase lỗi thì web tự dùng nội dung trong `public/content/`.

**Cài đặt (một lần):**

1. Supabase → dự án → **SQL Editor** → **New query**, dán toàn bộ `supabase/mnong.sql`, bấm **Run** (chỉ tạo/dọn bảng `mnong_*`, không đụng bảng của susu).
2. Vercel → dự án → **Settings** → **Environment Variables**, thêm (giá trị lấy trong file `.env.local` trên máy):
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`: tài khoản vào trang quản trị.
   - `SUPABASE_SERVICE_ROLE_KEY`: service role key của dự án Supabase (Settings → API Keys), giống key web susu đang dùng.
3. Vercel → **Deployments** → **Redeploy** bản mới nhất.
4. Mở `https://<tên-miền>/admin/`, đăng nhập, bấm **"Đưa nội dung hiện tại lên Supabase"** (chỉ lần đầu).

**Sửa được:** tên triển lãm, lời chào, video mở đầu; tên và lời giới thiệu từng gian; tiêu đề mọi hiện vật; nội dung bảng chữ; link YouTube; tên chiêng, tên bộ trang phục; toàn bộ câu hỏi trắc nghiệm (thêm, xoá, đổi thứ tự, chọn đáp án đúng). Ảnh, âm thanh, vị trí hiện vật, mã gian không sửa ở đây.

**Lưu ý:**

- Ô nào sai (bỏ trống, link YouTube không đọc được) sẽ có viền đỏ và chưa lưu được.
- Đổi mật khẩu: sửa `ADMIN_PASSWORD` trên Vercel rồi Redeploy.
- Thẻ SEO và chữ Google đọc được cập nhật ở lần build sau trên Vercel (mỗi lần push code, hoặc bấm Redeploy).
- **Lấy lại bản cũ:** mỗi lần lưu, bản trước được giữ trong bảng `mnong_content_history`. Xem các bản: `select id, content_id, saved_at from mnong_content_history order by id desc limit 20;`. Khôi phục bản số 123: `update mnong_content set data = (select data from mnong_content_history where id = 123) where id = (select content_id from mnong_content_history where id = 123);`
- Gói miễn phí của Supabase tạm dừng dự án sau một tuần không hoạt động. Web vẫn chạy bằng nội dung dự phòng; vào supabase.com bấm **Restore** để chạy lại.

**Khi đổi những thứ trang quản trị không sửa được** (ảnh, thêm hiện vật…), web đọc nội dung từ Supabase nên sửa file trong repo thôi là chưa đủ (cần `SUPABASE_SERVICE_ROLE_KEY` trong `.env.local`):

1. `npm run content:pull`: tải nội dung đang có trên web về `public/content/` (để không mất phần đã sửa ở trang quản trị).
2. Sửa file như các mục trên, chạy `npm run check:content`.
3. `npm run content:push`: đẩy lên Supabase.
4. Push code như thường lệ.
