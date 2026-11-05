import type { LText } from '../content/schema';

// Bản M'Nông mặc định là chữ tiếng Việt; bản dịch nhập ở trang quản trị (site.ui) ghi đè lúc tải nội dung.
const both = (vi: string): LText => ({ vi, mnong: vi });

export const UI = {
  language: both('Ngôn ngữ'),
  enter: both('Vào nhà dài'),
  introVideo: both('Video giới thiệu'),
  skipIntro: both('Bỏ qua'),
  prevRoom: both('Gian trước'),
  nextRoom: both('Gian sau'),
  roomList: both('Các gian triển lãm'),
  courtyard: both('Sân trước'),
  hall: both('Sảnh'),
  visitorName: both('Khách {n}'),
  visitorsOnline: both('người đang tham quan'),
  hideVisitors: both('Bấm để ẩn khách khác'),
  showVisitors: both('Bấm để hiện khách khác'),
  close: both('Đóng'),
  closeVideo: both('Đóng video'),
  listen: both('Nghe thuyết minh'),
  stop: both('Dừng thuyết minh'),
  audioError: both('Không tải được âm thanh'),
  mediaError: both('Không tải được'),
  viewerError: both('Không tải được trình xem 3D. Vui lòng kiểm tra mạng.'),
  viewAr: both('Xem AR'),
  arUnsupported: both('Máy này chưa hỗ trợ AR, bạn vẫn xoay xem được mô hình.'),
  hint: both('Chạm vòng tròn trên sàn để đi, kéo để nhìn quanh, chạm hiện vật để xem.'),
  hintDesktop: both('Bấm vòng tròn trên sàn hoặc dùng phím W A S D để đi, kéo chuột để nhìn quanh, bấm hiện vật để xem.'),
  open: both('Xem / nghe'),
  tapToView: both('Chạm để xem'),
  tapToStart: both('Chạm để bắt đầu'),
  tapGong: both('Chạm vào chiêng để nghe'),
  photoCorner: both('Góc chụp ảnh'),
  quizQuestion: both('Câu'),
  quizNext: both('Câu tiếp'),
  quizRetry: both('Chơi lại'),
  quizScore: both('Bạn trả lời đúng {score}/{total} câu'),
  quizCorrect: both('Đúng rồi!'),
  quizWrong: both('Chưa đúng.'),
  quizCount: both('Gồm {n} câu hỏi trắc nghiệm.'),
  boothCamera: both('Bật camera'),
  boothSwitch: both('Đổi camera'),
  boothShoot: both('Chụp ảnh'),
  boothUpload: both('Chọn ảnh có sẵn'),
  boothRetake: both('Chụp lại'),
  boothDownload: both('Tải ảnh về'),
  boothShare: both('Chia sẻ'),
  boothSize: both('Cỡ trang phục'),
  boothReset: both('Đặt lại'),
  boothFitHint: both('Kéo trang phục cho vòng tròn nằm trên mặt, rồi chụm/mở hai ngón tay (hoặc kéo thanh "Cỡ trang phục") cho vai áo vừa vai.'),
  boothNoCamera: both('Không mở được camera. Bạn có thể chọn ảnh có sẵn trong máy.'),
  boothFrame: both("Triển lãm số văn hóa M'Nông"),
  boothPrivacy: both('Ảnh chỉ nằm trên máy của bạn, không gửi đi đâu.'),
  boothHelpTitle: both('Hướng dẫn chụp ảnh'),
  // Mỗi dòng là một bước.
  boothHelp: both(
    [
      'Chọn bộ trang phục nam hoặc nữ ở hàng ảnh nhỏ phía trên.',
      'Bấm "Bật camera" và cho phép trình duyệt dùng camera.',
      'Đứng cách máy khoảng 2 mét để khung hình lấy được cả người. Nên nhờ người khác cầm máy, bấm "Đổi camera" để dùng camera sau.',
      'Kéo trang phục để vòng tròn nét đứt nằm đúng trên mặt, rồi chụm/mở hai ngón tay hoặc kéo thanh "Cỡ trang phục" cho vai áo vừa vai. Đứng thẳng, hai tay xuôi sẽ khớp nhất.',
      'Bấm "Chụp ảnh", rồi "Tải ảnh về" hoặc "Chia sẻ". Chưa ưng thì bấm "Chụp lại".',
      'Không mở được camera? Bấm "Chọn ảnh có sẵn" (ảnh chụp cả người), rồi kéo và chỉnh cỡ trang phục như trên.',
    ].join('\n'),
  ),
  loadError: both('Không tải được nội dung triển lãm. Vui lòng thử lại sau.'),
  readBook: both('Đọc sách 3D'),
  toExhibition: both('Triển lãm 3D'),
  toc: both('Mục lục'),
  page: both('Trang'),
  pageOf: both('Trang {p} / {n}'),
  prevPage: both('Trang trước'),
  nextPage: both('Trang sau'),
  bookHint: both('Kéo góc trang hoặc bấm ◀ ▶ để lật'),
  bookLoadError: both('Không tải được sách. Vui lòng thử lại sau.'),
  roomNo: both('Gian {n}'),
  continued: both('(tiếp theo)'),
  scanToRoom: both('Quét mã để vào gian này trong nhà dài 3D'),
  scanToHome: both('Quét mã để tham quan nhà dài 3D'),
  scanToBook: both('Quét mã để đọc sách trực tuyến'),
  visitLonghouse: both('Mời bạn vào nhà dài'),
  sheetsTitle: both('Tờ in theo gian'),
  printNow: both('In / lưu PDF'),
  paperSize: both('Khổ giấy'),
  sampleUrl: both('MẪU – KHÔNG IN: chưa có tên miền thật, mã QR đang trỏ tới địa chỉ thử'),
} satisfies Record<string, LText>;

export type UiKey = keyof typeof UI;

/** Áp bản dịch M'Nông nhập ở trang quản trị; ô trống hay khoá lạ thì giữ tiếng Việt. */
export function applyUiTranslations(map: Record<string, string> | undefined): void {
  for (const [key, text] of Object.entries(UI) as Array<[UiKey, LText]>) {
    const value = map?.[key]?.trim();
    text.mnong = value ? value : text.vi;
  }
}
