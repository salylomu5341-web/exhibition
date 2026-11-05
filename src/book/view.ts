import { PageFlip } from 'page-flip/dist/js/page-flip.module.js';
import { SHEET_RATIO } from '../sheets/layout';
import { h } from '../ui/dom';
import { chooseLayout, SHEET_PX, type BookLayout } from './pages';

/**
 * Cuốn sách lật trang (page-flip, chế độ HTML), mỗi trang là một tờ in. Tự chọn một trang hay hai trang
 * theo khổ màn hình, dựng lại khi đổi chế độ, và thu tờ (khổ A4) cho vừa bề rộng trang.
 */
export class BookView {
  private flip: PageFlip | null = null;
  private frame: HTMLElement | null = null;
  private sheets: HTMLElement[] = [];
  private layout: BookLayout | null = null;
  private current = 0;
  private pending = 0;

  constructor(
    private readonly host: HTMLElement,
    private readonly onChange: (index: number) => void,
  ) {
    window.addEventListener('resize', () => {
      cancelAnimationFrame(this.pending);
      this.pending = requestAnimationFrame(() => this.resize());
    });
  }

  get index(): number {
    return this.current;
  }

  get count(): number {
    return this.sheets.length;
  }

  get twoPage(): boolean {
    return this.layout?.twoPage ?? false;
  }

  next(): void {
    this.flip?.flipNext();
  }

  prev(): void {
    this.flip?.flipPrev();
  }

  go(index: number): void {
    this.flip?.turnToPage(index);
    this.setCurrent(index);
  }

  /** Thay toàn bộ trang (lúc mở sách hoặc đổi ngôn ngữ) và mở ở trang `start`. */
  load(sheets: HTMLElement[], start: number): void {
    this.teardown();
    this.sheets = sheets;
    this.current = Math.min(Math.max(start, 0), sheets.length - 1);
    this.build();
  }

  private measure(): BookLayout {
    const style = getComputedStyle(this.host);
    const w = this.host.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const hgt = this.host.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    return chooseLayout(Math.max(1, w), Math.max(1, hgt), SHEET_RATIO);
  }

  private applySize(layout: BookLayout): void {
    this.frame!.style.width = `${layout.blockWidth}px`;
    this.frame!.style.setProperty('--sheet-k', String(layout.pageWidth / SHEET_PX));
  }

  private build(): void {
    const layout = this.measure();
    this.layout = layout;
    const block = h('div', { class: 'book-block' });
    const frame = h('div', { class: 'book-frame' }, block);
    this.frame = frame;
    this.applySize(layout);
    this.host.append(frame);

    const last = this.count - 1;
    const pages = this.sheets.map((sheet, i) => {
      const page = h('div', { class: 'page' }, sheet);
      if (i === 0 || i === last) page.dataset.density = 'hard';
      return page;
    });

    // usePortrait/minWidth ép đúng chế độ đã chọn (page-flip tự quyết theo bề ngang khối).
    const flip = new PageFlip(block, {
      width: SHEET_PX,
      height: SHEET_PX / SHEET_RATIO,
      size: 'stretch',
      minWidth: layout.twoPage ? 1 : layout.pageWidth,
      maxWidth: 4000,
      usePortrait: !layout.twoPage,
      showCover: true,
      mobileScrollSupport: false,
      maxShadowOpacity: 0.5,
      flippingTime: 700,
      startPage: this.current,
    });
    flip.loadFromHTML(pages);
    flip.on('flip', (e) => this.setCurrent(e.data));
    this.flip = flip;
    this.setCurrent(this.current);
  }

  /** destroy() gỡ luôn khối sách; các tờ vẫn giữ lại để gắn vào khung mới. */
  private teardown(): void {
    this.flip?.destroy();
    this.frame?.remove();
    this.flip = null;
    this.frame = null;
  }

  private resize(): void {
    if (!this.flip || !this.frame) return;
    const layout = this.measure();
    if (layout.twoPage === this.layout?.twoPage) {
      this.layout = layout;
      this.applySize(layout);
      this.flip.update();
      return;
    }
    // Đổi một trang ↔ hai trang: dựng lại.
    this.teardown();
    this.build();
  }

  private setCurrent(index: number): void {
    this.current = index;
    this.center();
    this.onChange(index);
  }

  /**
   * Chế độ hai trang: bìa trước nằm ở nửa phải, bìa sau (khi đứng một mình) ở nửa trái.
   * Dời cả khung nửa trang để tờ bìa đứng giữa màn hình.
   */
  private center(): void {
    if (!this.frame) return;
    const last = this.count - 1;
    let side = 0;
    if (this.layout?.twoPage) {
      if (this.current === 0) side = -1;
      else if (this.count % 2 === 0 && this.current >= last) side = 1;
    }
    this.frame.style.transform = side ? `translateX(${side * 25}%)` : '';
  }
}
