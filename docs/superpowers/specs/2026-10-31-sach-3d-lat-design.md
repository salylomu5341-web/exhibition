# Thiết kế: Sách 3D lật văn hóa M'Nông (Phần 1 – QR Sách 3D lật)

- Ngày: 2026-10-31
- Hợp đồng: mục 5.1 "Phần 1 – QR Sách 3D lật". Sách điện tử dạng 3D lật trang như sách thật, hiện hình ảnh và nội dung từng trang do Bên A cung cấp, có mã QR riêng.
- Tư liệu: Bên A gửi nội dung từng trang dạng PDF hoặc ảnh theo thứ tự trang (mục 5.2).
- Nằm chung repo với Phần 2 (`docs/superpowers/specs/2026-10-30-trien-lam-3d-mnong-design.md`), dùng chung tên miền, cách build, SEO, mã QR.

## 1. Mục tiêu

Khách quét mã QR và mở `/sach/` trên điện thoại. Họ lật sách bằng cách kéo góc trang (trang cong và đổ bóng như sách thật), bằng nút ◀ ▶ hoặc phím ← →. Họ mở mục lục để nhảy tới chương hay trang bất kỳ, và đổi Việt / M'Nông khi có bộ trang M'Nông.

Tiêu chí đạt:
- `npm run build` tạo thêm `dist/sach/index.html` có đủ thẻ SEO.
- `npm run book:import -- <file.pdf | thư mục ảnh>` biến tư liệu của Bên A thành ảnh trang và ghi vào `book.json`, không cần sửa code.
- `npm run qr` tạo thêm mã QR cho sách.

## 2. Quyết định đã chốt

| Hạng mục | Chọn |
|---|---|
| Trang sách | Ảnh từng trang, đã dàn sẵn (từ PDF hoặc ảnh của Bên A) |
| Kiểu lật | Kéo góc, trang cong: thư viện `page-flip` 2.0.7 (MIT, chế độ HTML) |
| Ngôn ngữ | Hai bộ ảnh `vi` / `mnong`. Không có bộ `mnong` thì ẩn nút đổi |
| Thêm | Mục lục (chương + ảnh thu nhỏ mọi trang), nhảy trang, link `/sach/?trang=N` |
| Vị trí | Trang tĩnh `/sach/` trong cùng repo, bundle riêng (không kèm Three.js) |

Chưa làm đợt này: phóng to trang, tiếng lật, toàn màn hình, trang quản trị.

## 3. Nội dung: `public/content/book.json`

```json
{
  "title": { "vi": "Văn hóa M'Nông", "mnong": "[M'Nông] Văn hóa M'Nông" },
  "intro": { "vi": "Giới thiệu ngắn về cuốn sách…", "mnong": "…" },
  "seo": { "title": "…(50–60 ký tự)", "description": "…(<160)", "image": "/media/share/sach.jpg" },
  "pageSize": { "width": 1400, "height": 1980 },
  "pages": {
    "vi": ["/media/sach/vi/trang-001.webp", "…"],
    "mnong": ["/media/sach/mnong/trang-001.webp", "…"]
  },
  "toc": [{ "title": { "vi": "Cồng chiêng", "mnong": "…" }, "page": 3 }]
}
```

- `pageSize` là kích thước ảnh trang, dùng để lấy tỉ lệ khổ sách. Lệnh nhập tự ghi.
- Ảnh thu nhỏ theo quy ước: cùng tên, nằm trong thư mục con `nho/` (vd. `/media/sach/vi/nho/trang-001.webp`). Không ghi vào JSON.
- Ràng buộc kiểm tra: `pages.vi` có ít nhất 2 trang. `pages.mnong` (nếu có) dài bằng `pages.vi`. `toc[].page` nằm trong 1…số trang và tăng dần. Đủ file ảnh trang và ảnh thu nhỏ (`npm run check:content`).
- Số trang trong mục lục và trên link đánh từ 1, giống sách in.

## 4. Nhập trang: `npm run book:import -- <nguồn> [--lang vi|mnong]`

- Nguồn là file `.pdf`: dựng từng trang bằng `pdfjs-dist` (chạy trong Node, vẽ bằng canvas đi kèm pdfjs) ở bề ngang 1400 px.
- Nguồn là thư mục ảnh: lấy `.jpg/.jpeg/.png/.webp`, xếp theo tên tự nhiên (`2` đứng trước `10`), thu về tối đa 1400 px bề ngang.
- Đầu ra: `public/media/sach/<lang>/trang-NNN.webp` (chất lượng 82) và ảnh thu nhỏ `nho/trang-NNN.webp` rộng 240 px. Xoá ảnh `trang-*.webp` cũ của ngôn ngữ đó trước khi ghi.
- Cập nhật `book.json`: `pages[lang]`, và với `vi` thì cả `pageSize` (lấy từ trang 1) cùng ảnh chia sẻ `seo.image`. Ảnh chia sẻ là JPG 1200×630, bìa đặt trên nền gỗ, đúng checklist SEO (Zalo không đọc WebP). Các khoá khác giữ nguyên.
- `toc` vẫn do người nhập tay (tên chương, số trang).
- `npm run assets` (tạo file mẫu) tạo thêm 12 trang mẫu cho cả `vi` và `mnong`, cùng ảnh thu nhỏ và ảnh chia sẻ, để dựng và kiểm thử trước khi có sách thật.

## 5. Trang `/sach/`

### Bố cục
- **Thanh trên:** tên sách, nút "Mục lục", nút VI / M'Nông (ẩn khi không có bộ `mnong`), link "Triển lãm 3D" về `/`.
- **Giữa:** cuốn sách trên nền gỗ / thổ cẩm, giống triển lãm.
- **Thanh dưới:** nút ◀, chữ "Trang 2–3 / 24" (hoặc "Trang 5 / 24" khi hiện một trang), nút ▶.
- Lần đầu mở có dòng gợi ý "Kéo góc trang hoặc bấm ◀ ▶ để lật". Dòng này ẩn sau lần lật đầu tiên.

### Một trang hay hai trang
`page-flip` ở chế độ `stretch` tự cao theo bề ngang nên phải tự tính bề ngang để sách vừa màn hình. Cho vùng trống `W×H` (trừ hai thanh) và tỉ lệ trang `r = width/height`:
- bề ngang trang khi hiện một trang: `p1 = min(W, H·r)`.
- bề ngang trang khi hiện hai trang: `p2 = min(W/2, H·r)`.
- Hiện hai trang khi `p2 ≥ 0.85·p1`. Kết quả: máy tính và điện thoại xoay ngang hiện 2 trang; điện thoại dọc và tablet dọc hiện 1 trang to.

Khối sách rộng `2·p2` (hai trang) hoặc `p1` (một trang). Hai trang thì dùng `usePortrait: false`. Một trang thì `usePortrait: true`, `minWidth = p1`. Khi đổi cỡ màn hình:
- Vẫn cùng chế độ: đặt lại bề ngang khối rồi gọi `update()`.
- Đổi chế độ: dựng lại `PageFlip` ở đúng trang đang đọc, vì `destroy()` gỡ luôn khối nên tạo khối mới.

Cấu hình chung: `size: 'stretch'`, `maxWidth: 4000`, `showCover: true` (bìa trước và bìa sau là trang cứng `data-density="hard"`), `mobileScrollSupport: false`, `maxShadowOpacity: 0.5`, `flippingTime: 700`.

### Trang đôi và số trang
Có `showCover`, trang đầu (bìa) đứng một mình, sau đó là các cặp (2–3), (4–5)… Nếu tổng số trang chẵn thì trang cuối đứng một mình. Hàm thuần trong `src/book/pages.ts`:
- `spreadOf(index, count, twoPage)` → các chỉ số trang đang hiện.
- `pageLabel(...)` → "2–3".
- `parsePageParam('?trang=12', count)` → chỉ số 0-based, kẹp vào khoảng hợp lệ. Sai hoặc thiếu thì về 0.
- `thumbOf(path)` → đường dẫn ảnh thu nhỏ.

### Tải ảnh
Mỗi trang là `div.page` chứa `<img alt="Trang N">`. Chỉ trang trong khoảng ±4 quanh trang đang đọc được gán `src`, cập nhật sau mỗi lần lật, nên sách 100 trang vẫn nhẹ. Nền trang màu giấy kèm số trang mờ trong lúc ảnh đang tải.

### Mục lục
Khung trượt (dùng lại kiểu `.panel` của triển lãm) gồm:
- danh sách chương từ `toc`, mỗi dòng ghi số trang;
- lưới ảnh thu nhỏ mọi trang (`loading="lazy"`).

Bấm một mục thì `turnToPage(i)`, đóng khung và trả tiêu điểm về nút "Mục lục". Esc cũng đóng khung.

### Link và ngôn ngữ
- Sau mỗi lần lật, `history.replaceState` đổi địa chỉ thành `/sach/?trang=N`, với N là trang đầu của cặp đang hiện. Trang 1 thì bỏ `?trang`.
- Đổi ngôn ngữ thì đổi `src` của các ảnh đã gán sang bộ kia, giữ nguyên trang. Ngôn ngữ dùng chung `localStorage` và `?lang=` với triển lãm (`initLang`).
- Bàn phím: ← → lật trang khi tiêu điểm không nằm trong ô nhập liệu và khung mục lục đang đóng.

### Kiểm thử và gỡ lỗi
`window.__book = { page, pageCount, twoPage, go(n) }`, với số trang đánh từ 1.

## 6. Bản chữ, SEO, QR, liên kết

- `sach/index.html` là trang Vite thứ hai (`build.rollupOptions.input`), có chỗ đánh dấu `<!--SEO-->` và `<!--TEXT-->` giống `index.html`.
- `scripts/build-pages.ts` điền vào `dist/sach/index.html`:
  - Thẻ head: title, description, canonical `/sach/`, Open Graph đủ khoá, Twitter `summary_large_image`, ảnh `/media/share/sach.jpg`.
  - JSON-LD `Book` gồm `name`, `url`, `inLanguage: "vi"`, `numberOfPages`, `image`, và `isPartOf` trỏ tới `Museum` của triển lãm.
  - Bản chữ `#text-version`: một `h1` tên sách, đoạn giới thiệu, mục lục `h2` với link `?trang=N`, link về triển lãm.
- Bản chữ ẩn khỏi màn hình khi sách đã chạy (như `mode-3d`) nhưng vẫn nằm trong cây truy cập. Khi không có JS, khách vẫn đọc được bản chữ.
- `sitemap.xml` thêm `/sach/`. `robots.txt` không đổi.
- `npm run qr` thêm mã `sach.png/svg` (nhãn "Sách 3D: <tên sách>") vào bảng in.
- Từ triển lãm sang sách:
  - Thẻ chào ở cổng có thêm link "Đọc sách 3D".
  - Bản chữ trang chủ có link tới `/sach/`.
- Ảnh trang không có chữ cho máy đọc. Alt chỉ là "Trang N". Bản chữ bù lại bằng tên sách, giới thiệu và mục lục.

## 7. Lỗi và trường hợp biên

- Không tải được `book.json` hoặc dữ liệu sai: hiện thông báo "Không tải được sách…" và để bản chữ hiện ra.
- Ảnh trang lỗi: trang giữ nền giấy và số trang, không làm hỏng việc lật.
- `?trang=` vượt số trang thì kẹp về trang cuối. Giá trị không phải số thì về trang 1.
- Sách có ít hơn 2 trang thì bị lệnh kiểm tra nội dung từ chối.

## 8. Kiểm thử

**Unit:**
- Schema sách: hợp lệ; `mnong` lệch số trang; `toc` vượt trang hoặc không tăng dần; ảnh nằm trong `nho/`.
- `spreadOf`, `pageLabel`, `parsePageParam`, `thumbOf`.
- Quy tắc một trang hay hai trang `chooseLayout(W, H, r)`.
- `bookJsonLd`.
- Bản chữ sách có đúng một h1.
- `book.json` thật đọc được và đủ file.

**E2e (điện thoại và máy tính):**
- Mở `/sach/?trang=5` thì hook báo trang 4 hoặc 5 tuỳ một trang hay hai trang. Bấm ▶ thì địa chỉ đổi.
- Mở mục lục, bấm chương thì nhảy đúng trang.
- Đổi M'Nông thì giữ trang và `src` ảnh chuyển sang `/mnong/`.
- `/sach/` có canonical, og:image `.jpg`, JSON-LD `Book` và một h1.
- Từ trang chủ có link tới `/sach/`.
