# Tờ in theo gian (và sách 3D dựng từ các tờ này)

Khách (Bên A) muốn mỗi gian có tờ giấy in: chữ giới thiệu của gian, ảnh xung quanh, mã QR dẫn vào đúng gian đó trong nhà dài 3D. Sách 3D lật `/sach/` dùng chính các tờ này thay cho trang nhập từ PDF.

## Quyết định

- Khổ A4 đứng (210×297 mm). In A3 bằng `?kho=a3` (phóng đúng tỉ lệ).
- Chữ: toàn bộ lời giới thiệu của gian = phần thân hiện vật `board` có id `gioi-thieu`; gian không có thì dùng `intro` của gian. Tiêu đề nhỏ `## ` giữ nguyên.
- Chia tờ theo đoạn văn với hạn mức số ký tự (tờ đầu ít hơn vì có ảnh), không cắt giữa đoạn, không để tiêu đề nhỏ đứng cuối tờ. Số tờ chỉ phụ thuộc nội dung, giống nhau trên mọi máy. Trên từng tờ, chữ tự thu nhỏ (tối thiểu 10 px) nếu chưa vừa.
- Ảnh: ảnh của các hiện vật `gallery` trong gian. Tờ đầu tối đa 3 ảnh, mỗi tờ sau 1 ảnh (hết ảnh thì không có).
- Tờ nào của gian cũng có mã QR tới `/phong/<slug>/`. Tên miền lấy `SITE_URL` lúc build; còn là giá trị mẫu thì dùng tên miền đang mở và trang in hiện băng "MẪU – KHÔNG IN".
- Sách: bìa → các gian theo thứ tự → trang cuối (QR về trang chủ, danh sách gian). Bìa là ảnh `cover` trong `book.json` nếu có, không thì bìa chữ.
- Bỏ ảnh trang, `book:import`, `pdfjs-dist`; `book.json` chỉ còn `title`, `intro`, `seo`, `cover?`.

## Thành phần

- `src/sheets/layout.ts` (hàm thuần): `buildSheets(site, rooms, book, lang)` → danh sách tờ (`cover` | `room` | `back`).
- `src/sheets/render.ts` (DOM): dựng `.sheet` theo tờ, gắn QR (thư viện `qrcode`), `fitSheets` thu chữ cho vừa.
- `src/sheets/sheet.css`: bố cục tờ, đơn vị mm, dùng chung cho màn hình và in.
- `/in/` (`in/index.html`, `src/print/main.ts`): mọi tờ của một ngôn ngữ, nút In, đổi ngôn ngữ, khổ A4/A3; `noindex`, không vào sitemap, không ghi trong robots.txt.
- `/sach/`: `BookView` đặt các tờ vào trang page-flip, thu theo bề rộng trang; đổi ngôn ngữ thì dựng lại và giữ gian đang đọc. Mục lục = danh sách gian.
