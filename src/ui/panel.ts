import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

export interface PanelContent {
  el: HTMLElement;
  /** Vẽ lại chữ theo ngôn ngữ hiện tại, giữ nguyên trạng thái. */
  update(): void;
  dispose(): void;
}

export class Panel {
  private readonly root: HTMLElement;
  private readonly titleEl: HTMLHeadingElement;
  private readonly body: HTMLElement;
  private readonly closeBtn: HTMLButtonElement;
  private current: { key: string; title: () => string; content: PanelContent } | null = null;
  /** Phần tử có tiêu điểm trước khi mở khung, trả tiêu điểm về khi đóng. */
  private returnFocus: HTMLElement | null = null;

  constructor(host: HTMLElement) {
    this.titleEl = h('h2', { id: 'panel-title' });
    this.closeBtn = h('button', { type: 'button', class: 'panel-close' }, '✕');
    this.closeBtn.addEventListener('click', () => this.close());
    const head = h('div', { class: 'panel-head' }, h('span', { class: 'panel-grip' }), this.titleEl, this.closeBtn);
    this.body = h('div', { class: 'panel-body' });
    this.root = h('aside', { class: 'panel', 'aria-labelledby': 'panel-title', 'aria-hidden': 'true' }, head, this.body);
    this.root.inert = true;
    host.append(this.root);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.close();
    });
    let startY: number | null = null;
    head.addEventListener('pointerdown', (e) => {
      // Giữ con trỏ để vuốt đóng thì sự kiện click về khung đầu, nút ✕ không nhận được (chuột trên máy tính).
      if ((e.target as Element).closest('.panel-close')) return;
      startY = e.clientY;
      head.setPointerCapture(e.pointerId);
    });
    head.addEventListener('pointercancel', () => {
      startY = null;
    });
    head.addEventListener('pointerup', (e) => {
      if (startY !== null && e.clientY - startY > 60) this.close();
      startY = null;
    });
    this.relangChrome();
  }

  /** Đổi chỗ trả tiêu điểm khi đóng (ví dụ nút đã bị dựng lại). */
  setReturnFocus(el: HTMLElement | null): void {
    this.returnFocus = el;
  }

  get openKey(): string | null {
    return this.current?.key ?? null;
  }

  open(key: string, title: () => string, content: PanelContent): void {
    this.current?.content.dispose();
    this.current = { key, title, content };
    this.titleEl.textContent = title();
    this.body.replaceChildren(content.el);
    this.body.scrollTop = 0;
    if (!this.root.contains(document.activeElement)) {
      this.returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
    this.root.classList.add('open');
    this.root.setAttribute('aria-hidden', 'false');
    this.root.inert = false;
    this.closeBtn.focus({ preventScroll: true });
  }

  close(): void {
    if (!this.current) return;
    this.current.content.dispose();
    this.current = null;
    // inert trước để tiêu điểm rời khung, rồi mới trả về chỗ cũ.
    this.root.inert = true;
    this.root.classList.remove('open');
    this.root.setAttribute('aria-hidden', 'true');
    this.body.replaceChildren();
    const back = this.returnFocus;
    this.returnFocus = null;
    if (back?.isConnected) back.focus({ preventScroll: true });
  }

  relang(): void {
    this.relangChrome();
    if (!this.current) return;
    this.titleEl.textContent = this.current.title();
    this.current.content.update();
  }

  private relangChrome(): void {
    this.closeBtn.setAttribute('aria-label', t(UI.close));
  }
}
