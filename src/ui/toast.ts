import { h } from './dom';

/** Một vùng role=status dùng lại cho mọi thông báo, để chạm chiêng liên tục không chồng nhiều toast. */
let el: HTMLDivElement | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;
let frame = 0;

export function showToast(text: string): void {
  if (!el) {
    // Tạo vùng thông báo rỗng trước, đặt chữ ở khung sau để trình đọc màn hình đọc cả toast đầu tiên.
    el = h('div', { class: 'toast', role: 'status' });
    document.body.append(el);
  }
  const node = el;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    node.textContent = text;
    // Chạy lại hiệu ứng: bỏ lớp, ép reflow, thêm lại.
    node.classList.remove('show');
    void node.offsetWidth;
    node.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(() => {
      node.classList.remove('show');
      node.textContent = '';
    }, 1700);
  });
}
