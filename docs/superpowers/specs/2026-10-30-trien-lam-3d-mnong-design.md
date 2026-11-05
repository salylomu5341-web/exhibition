# Thiết kế: Triển lãm 3D văn hóa M'Nông (Phần 2 – Web AR)

- Ngày: 2026-10-30
- Hợp đồng: "Hợp đồng thiết kế website Triển lãm số văn hóa M'Nông" (Bên A: bà Lơ Mu Saly; Bên B: Công ty TNHH Navi Website)
- Phạm vi tài liệu này: **Phần 2 – QR Web AR Triển lãm số** trong mục 5.1 của hợp đồng. Phần 1 (Sách 3D lật) có tài liệu thiết kế riêng.
- Tiến độ: 05 ngày làm việc (Điều 8 hợp đồng).

## 1. Mục tiêu

Khách quét mã QR (chủ yếu bằng điện thoại) và "đi bộ" bên trong một nhà dài M'Nông dựng bằng 3D. Mỗi gian nhà là một phòng triển lãm. Khách chạm vào hiện vật để đọc giới thiệu song ngữ Việt – M'Nông, nghe thuyết minh, xem ảnh, xem video, bấm chiêng nghe tiếng, xem hiện vật bằng AR, mặc thử trang phục để chụp ảnh và làm trắc nghiệm.

Tiêu chí đạt:

- Chạy được trên điện thoại iOS và Android phổ biến, và trên máy tính.
- Người không quen chơi game vẫn đi hết 7 gian mà không bị kẹt hay lạc.
- Mọi chữ hiện trên màn hình đều có hai thứ tiếng; nút chuyển ngôn ngữ đổi cả chữ lẫn giọng thuyết minh.
- Thay nội dung (chữ, ảnh, video, âm thanh, câu hỏi) không cần sửa code, chỉ sửa file JSON và thay file media.
- Máy không chạy được 3D vẫn xem được toàn bộ nội dung.

## 2. Các quyết định đã chốt

| Vấn đề | Quyết định |
|---|---|
| Kiểu trải nghiệm | Đi bộ góc nhìn thứ nhất trong nhà dài 3D |
| Di chuyển | Chạm vòng tròn trên sàn để đi tới + thanh "Gian trước / Gian sau / danh sách gian". Máy tính có thêm W A S D / phím mũi tên và chuột |
| Mặc trang phục | Khung ảnh trang phục phủ lên camera; có thêm "chọn ảnh có sẵn" |
| Song ngữ | Nút chuyển VI / M'Nông, đổi cả chữ và thuyết minh |
| Video | YouTube chế độ không công khai, nhúng vào |
| Kỹ thuật | Web tĩnh: Vite + TypeScript + Three.js, nội dung trong file JSON |
| Tư liệu | Dùng ảnh, âm thanh, video giả làm đại diện; Bên A gửi tư liệu thật sau |

**Khác biệt với hợp đồng cần ghi nhận:** mục 5.1 có "Hệ thống quản trị nội dung cơ bản". Ở giai đoạn này nội dung được sửa qua file JSON; trang quản trị chưa làm và được xếp vào giai đoạn sau.

## 3. Không gian 3D

### 3.1 Mặt bằng

Nhà dài dài khoảng 70m, rộng khoảng 10m, mô phỏng theo ảnh nhà dài Bên A gửi: mái tranh dốc lớn, vách đan nan tre hoa văn, cột gỗ, nền đá, bậc thềm gỗ.

```
 sân trước ─► [cửa + bậc thềm]
 ┌──────┬────────┬────────┬────────┬────────┬────────┬────────┬────────┐
 │ Sảnh │ 1.Cồng │ 2.Lễ   │ 3.Cúng │ 4.Lễ   │ 5.Hát, │ 6.Trang│ 7.Trắc │
 │      │ chiêng │ cầu mùa│ bến    │ báo    │ xoang, │ phục   │ nghiệm │
 │      │        │        │ nước   │ hiếu   │ nhạc cụ│        │        │
 │ ○────┼──○──○──┼──○──○──┼──○──○──┼──○──○──┼──○──○──┼──○──○──┼──○──○  │  ← lối giữa, ○ = điểm đứng
 └──────┴────────┴────────┴────────┴────────┴────────┴────────┴────────┘
```

- Khách bắt đầu ở **sân trước**, nhìn thấy mặt ngoài nhà dài. Chạm vào cửa để vào.
- **Sảnh**: lời chào, tên triển lãm, chọn ngôn ngữ, hướng dẫn ngắn cách di chuyển.
- **7 gian** liên tiếp dọc lối giữa, ngăn bằng cột gỗ. Tên gian song ngữ treo trên xà.
- Mỗi gian có 2 điểm đứng trên lối giữa. Hiện vật đặt sát hai vách dọc (treo trên vách hoặc đứng ngay trước vách), lối giữa để trống cho khách đi.

### 3.2 Hiện vật theo gian

| Gian | Hiện vật |
|---|---|
| 1. Văn hóa cồng chiêng | Bảng giới thiệu; vách ảnh; màn hình video; **giá treo 6 chiêng bấm phát tiếng**; bục AR (chiêng mẫu) |
| 2. Lễ cầu mùa | Bảng giới thiệu; vách ảnh; màn hình video |
| 3. Lễ cúng bến nước | Bảng giới thiệu; vách ảnh; màn hình video |
| 4. Lễ báo hiếu | Bảng giới thiệu; vách ảnh; màn hình video |
| 5. Bài hát dân tộc, múa xoang, nhạc cụ dân gian | 3 khu nhỏ, mỗi khu một bảng giới thiệu + một màn hình video |
| 6. Trang phục | Bảng giới thiệu; ma-nơ-canh mặc trang phục; màn hình video; **góc chụp ảnh** |
| 7. Câu hỏi trắc nghiệm | **Bảng trắc nghiệm** lớn ở cuối nhà |

Mọi gian đều có thể thêm bục AR khi Bên A có mô hình 3D (hợp đồng: không giới hạn số hiện vật AR).

### 3.3 Dựng hình

- Nhà dài, sân, cột, vách, mái dựng bằng code từ hình khối cơ bản, phủ ảnh vân bề mặt (vách đan, mái tranh, gỗ, đá). Không dựng mô hình trong Blender.
- Vân bề mặt tối đa 1024px, dùng lặp lại (repeat).
- Ánh sáng: một nguồn sáng môi trường ấm + ánh sáng hướng; không dùng bóng đổ thời gian thực trên điện thoại.
- Độ nét màn hình (pixel ratio) giới hạn 1.5.

## 4. Di chuyển

- **Chạm vòng tròn trên sàn**: camera trượt mượt (khoảng 0,8 giây) tới điểm đó.
- **Kéo một ngón / kéo chuột**: xoay hướng nhìn (giới hạn góc ngẩng, cúi).
- **Thanh dưới màn hình**: "◀ Gian trước", tên gian hiện tại "2/7 · Lễ cầu mùa", "Gian sau ▶", và nút mở danh sách 7 gian để nhảy thẳng tới.
- **Máy tính**: W A S D / mũi tên để đi tự do trên lối giữa (giới hạn trong hình chữ nhật của nhà, không cần xử lý va chạm phức tạp).
- **Chạm hiện vật**: mở khung thông tin; hiện vật có viền sáng nhẹ khi ở gần để khách biết chạm được.

## 5. Tính năng

### 5.1 Khung thông tin

- Điện thoại: trượt lên từ dưới. Máy tính: hiện ở cạnh phải.
- Gồm: tiêu đề, nội dung, nút ▶ nghe thuyết minh, bộ ảnh vuốt qua lại (chạm để xem lớn), video YouTube.
- Video nhúng qua `youtube-nocookie.com`, chỉ tải khi khung mở.
- Đóng khung bằng nút ✕, vuốt xuống, hoặc phím Esc.

### 5.2 Song ngữ và thuyết minh

- Nút VI / M'Nông cố định ở góc trên. Mặc định VI.
- Đổi ngôn ngữ cập nhật ngay: chữ trong cảnh 3D (tên gian, nhãn), chữ trong khung, giọng thuyết minh.
- Lựa chọn lưu trong `localStorage` (bọc try/catch; lỗi thì dùng mặc định). Link có thể ép ngôn ngữ bằng `?lang=vi` hoặc `?lang=mnong`.
- Mục nào chưa có file thuyết minh cho ngôn ngữ đang chọn thì ẩn nút ▶.
- Chỉ phát một thuyết minh tại một thời điểm; đổi ngôn ngữ hoặc đóng khung thì dừng.

### 5.3 Sáu chiếc chiêng (gian 1)

- 6 chiêng treo trên giá gỗ đặt trước vách trái của gian 1; mặt chiêng dùng ảnh chiêng thật làm vân.
- Chạm chiêng: phát tiếng của chiêng đó, chiêng rung nhẹ, hiện tên song ngữ.
- Âm thanh dùng Web Audio; giải mã sẵn ngay lần chạm đầu tiên vào trang để các lần chạm sau kêu tức thì. Chạm liên tục cho phép tiếng chồng lên nhau.
- Khung thông tin của giá chiêng có hàng 6 nút chiêng 2D, cho người khó chạm trúng trong cảnh 3D.
- Tiếng chiêng giả: tạo bằng code (tổng hợp âm kim loại) xuất ra file, thay bằng bản thu thật sau.

### 5.4 Góc chụp ảnh trang phục (gian 6)

- Chọn bộ trang phục (danh sách từ JSON, ví dụ nam / nữ).
- Mở camera trước bằng `getUserMedia`; có nút đổi camera trước/sau.
- Ảnh trang phục (PNG nền trong suốt, chừa chỗ mặt) phủ lên hình camera.
- Bấm chụp: ghép hình camera + trang phục + khung "Triển lãm số văn hóa M'Nông" lên canvas, xuất JPG.
- Tải ảnh về; nếu trình duyệt hỗ trợ Web Share thì có thêm nút chia sẻ.
- Khách từ chối camera, hoặc máy không có camera: tự chuyển sang "chọn ảnh có sẵn"; khách kéo và phóng to ảnh cho khớp khung rồi lưu.
- **Ảnh chỉ xử lý trên máy khách, không gửi lên server.**

### 5.5 Trắc nghiệm (gian 7)

- Câu hỏi lấy từ JSON (dự kiến khoảng 10 câu), mỗi câu 4 đáp án, chữ song ngữ.
- Hiện từng câu. Chạm đáp án: tiếng đúng/sai, đáp án đổi màu xanh/đỏ, hiện lời giải thích ngắn, nút "Câu tiếp".
- Cuối bài: tổng điểm và nút "Chơi lại".
- Không lưu điểm lên server.

### 5.6 AR

- Hiện vật có file `.glb` thì có nút "Xem AR", mở `<model-viewer>` trong khung thông tin.
- Chế độ AR: `webxr`, `scene-viewer` (Android), `quick-look` (iPhone, cần thêm file `.usdz`).
- Máy không hỗ trợ AR: vẫn xoay xem mô hình 3D, nút AR ẩn.
- Mô hình giả: một chiếc chiêng tạo bằng code, xuất `.glb`.

### 5.7 Link và mã QR

- Trang chính: `/` (bắt đầu ở sân trước).
- Mỗi gian: `/phong/<slug>/` (bắt đầu ở điểm đứng đầu tiên của gian).
- Mỗi hiện vật: `/phong/<slug>/?v=<id-hiện-vật>` → camera đứng trước hiện vật đó và khung thông tin tự mở.
- `id` hiện vật không tồn tại → mở gian như bình thường.
- `npm run qr` tạo mã QR (SVG + PNG) cho trang chính, từng gian, từng hiện vật, và một trang A4 để in.

## 6. Dữ liệu nội dung

```
public/
  content/
    site.json            tên triển lãm, lời chào ở sảnh, cấu hình chung
    rooms/
      01-cong-chieng.json
      02-le-cau-mua.json
      ...
      07-trac-nghiem.json
  media/
    <slug-gian>/         ảnh, âm thanh, thuyết minh, mô hình của gian đó
    textures/            vân vách đan, mái tranh, gỗ, đá
```

- Chữ song ngữ luôn có dạng `{ "vi": "...", "mnong": "..." }`.
- Thuyết minh: `{ "vi": "media/.../tm-vi.mp3", "mnong": "media/.../tm-mnong.mp3" }`, mỗi khóa có thể bỏ trống.
- Mỗi gian: `id`, `slug`, `order`, `name`, `intro`, `seo` (title, description, ảnh chia sẻ), `exhibits[]`.
- Mỗi hiện vật: `id`, `type`, `position` (vách trái / vách phải + thứ tự 0–2), và các trường riêng theo `type`:

| `type` | Trường riêng |
|---|---|
| `board` | `title`, `body`, `narration` |
| `gallery` | `images[]` (`src`, `alt`, `caption`) |
| `video` | `title`, `youtubeId` |
| `gongs` | `gongs[]` (`name`, `image`, `sound`) – đúng 6 chiêng |
| `ar` | `title`, `body`, `glb`, `usdz` (tuỳ chọn), `poster` |
| `costume` | `costumes[]` (`name`, `overlay` PNG, `thumb`) |
| `quiz` | `questions[]` (`question`, `options[4]`, `answer`, `explain`) |

- Lúc build, một bước kiểm tra cấu trúc (schema) chạy trên toàn bộ JSON. Sai cấu trúc thì build dừng và báo rõ file + trường sai.
- Nội dung giả: ảnh mẫu đánh số rõ ("Ảnh cồng chiêng 1"), chữ mẫu song ngữ ghi rõ "[nội dung mẫu]", một `youtubeId` mẫu, tiếng chiêng và mô hình chiêng tạo bằng code.

## 7. Cấu trúc code

Vite + TypeScript + Three.js, không dùng framework giao diện.

| Thư mục | Trách nhiệm |
|---|---|
| `src/content/` | Kiểu dữ liệu, đọc JSON, kiểm tra schema |
| `src/scene/` | Dựng nhà dài, sân trước, ánh sáng, nạp vân bề mặt |
| `src/nav/` | Điều khiển camera: chạm điểm đứng, kéo để nhìn, W A S D, nhảy gian, link tới hiện vật |
| `src/exhibits/` | Đặt hiện vật vào cảnh theo `type`, xử lý chạm, viền sáng |
| `src/ui/` | Lớp giao diện trên 3D: khung thông tin, thanh gian, nút ngôn ngữ, trình phát thuyết minh |
| `src/features/` | Tiếng chiêng, trắc nghiệm, chụp ảnh trang phục, AR |
| `src/i18n/` | Trạng thái ngôn ngữ, hàm lấy chữ theo ngôn ngữ |
| `scripts/` | Tạo trang SEO cho từng gian, sitemap, robots, mã QR, tiếng chiêng và mô hình giả |
| `site.config.ts` | Tên miền (`SITE_URL`), tên triển lãm, cấu hình chung |

Các phần giao tiếp với nhau qua các hàm nhỏ có kiểu rõ ràng (ví dụ `openPanel(exhibit)`, `goToStandpoint(id)`, `setLang(lang)`), để thay đổi bên trong một phần không làm hỏng phần khác.

## 8. SEO

Theo checklist SEO chung:

- Mỗi gian có trang HTML riêng tạo lúc build ở `/phong/<slug>/index.html`, kèm trang chủ.
- Mỗi trang: title riêng 50–60 ký tự (schema chặn trên 60, `check:content` cảnh báo dưới 50); description riêng dưới 160 ký tự; canonical riêng; Open Graph đủ `og:title`, `og:description`, `og:image`, `og:url`, `og:type`, `og:locale`, `og:site_name`; Twitter `summary_large_image`; ảnh chia sẻ JPG 1200×630.
- JSON-LD kiểu `Museum` cho toàn web.
- Mỗi trang có bản chữ HTML thật nằm dưới cảnh 3D: một `h1` (tên gian), các `h2` cho từng mục, không nhảy cấp tiêu đề; mọi ảnh có `alt`; chân trang dùng `h2`, không dùng `h4`.
- `robots.txt` (cho index, trỏ tới sitemap) và `sitemap.xml` (đủ trang chủ + 7 gian) tạo tự động lúc build.
- `SITE_URL` đặt trong `site.config.ts`. Build bản chính thức mà `SITE_URL` vẫn là giá trị mẫu thì build báo lỗi.

## 9. Xử lý lỗi

- Không có WebGL, hoặc tạo cảnh 3D thất bại → ẩn cảnh 3D, hiện bản chữ HTML (mục 8) làm bản 2D đầy đủ: ảnh, video, 6 nút chiêng, trắc nghiệm, chụp ảnh trang phục, nút ngôn ngữ.
- Ảnh hoặc vân bề mặt tải lỗi → ô màu trơn có tên hiện vật, cảnh vẫn chạy.
- Âm thanh tải lỗi → nút chiêng / thuyết minh tắt kèm chú thích ngắn.
- Camera bị từ chối hoặc không có → chuyển sang "chọn ảnh có sẵn" (mục 5.4).
- Máy không hỗ trợ AR → chỉ xem 3D xoay được (mục 5.6).
- Link tới hiện vật không tồn tại → mở gian như bình thường (mục 5.7).

## 10. Hiệu năng

- Mục tiêu lần tải đầu dưới khoảng 5MB trên mạng 4G.
- Vân bề mặt dùng chung được nạp trước; ảnh trưng bày của từng gian nạp khi khách tới gần gian đó (gian hiện tại và gian kề bên).
- Video và mô hình AR chỉ nạp khi mở khung thông tin.

## 11. Kiểm thử

- **Vitest**: kiểm tra schema JSON (file đúng / file sai), hàm tính điểm trắc nghiệm, hàm đọc link (`slug`, `?v=`, `?lang=`), hàm lấy chữ theo ngôn ngữ.
- **Playwright** (giả lập điện thoại và máy tính): mở trang, vào nhà, chuyển gian bằng thanh dưới, mở khung thông tin, đổi ngôn ngữ, làm hết trắc nghiệm, mở link hiện vật, bản 2D khi tắt WebGL.
- **Thử tay trên máy thật** (iPhone + Android): AR, camera chụp ảnh trang phục, tiếng chiêng, độ mượt khi đi.
- Kiểm tra SEO: mỗi trang có đủ thẻ meta, một `h1`, sitemap đủ trang.

## 12. Tiến độ 5 ngày

| Ngày | Việc |
|---|---|
| 1 | Khung dự án, schema + nội dung giả, dựng nhà dài và sân trước |
| 2 | Di chuyển, đặt hiện vật, khung thông tin, nút ngôn ngữ, thuyết minh |
| 3 | Chiêng, trắc nghiệm, chụp ảnh trang phục, AR |
| 4 | Link hiện vật + QR, trang SEO, bản 2D dự phòng, tối ưu tốc độ |
| 5 | Thử trên máy thật, sửa lỗi, hướng dẫn thay nội dung, đưa lên server |

## 13. Triển khai

- `npm run build` → thư mục `dist/` gồm toàn bộ trang tĩnh.
- Đưa `dist/` lên server 2GB (nginx phục vụ file tĩnh, bật nén gzip/brotli, cache dài cho file media).
- Kèm tài liệu ngắn "Cách thay nội dung": sửa file JSON nào, đặt ảnh / âm thanh / mô hình ở đâu, lấy `youtubeId` từ link YouTube, chạy lại build và QR.

## 14. Ngoài phạm vi

- Phần 1 – Sách 3D lật (tài liệu thiết kế riêng).
- Trang quản trị nội dung (giai đoạn sau).
- Tư liệu thật: chữ, bản dịch M'Nông, ảnh, video, thu âm thuyết minh, thu tiếng chiêng, mô hình 3D (Bên A cung cấp theo mục 5.2 hợp đồng).
- AR bám theo người cho trang phục.
