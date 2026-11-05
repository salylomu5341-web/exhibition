// page-flip 2.0.7 không kèm kiểu TypeScript; chỉ khai báo phần dự án dùng.
declare module 'page-flip/dist/js/page-flip.module.js' {
  export interface FlipSetting {
    width: number;
    height: number;
    size?: 'fixed' | 'stretch';
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    startPage?: number;
    usePortrait?: boolean;
    showCover?: boolean;
    autoSize?: boolean;
    drawShadow?: boolean;
    maxShadowOpacity?: number;
    flippingTime?: number;
    mobileScrollSupport?: boolean;
    showPageCorners?: boolean;
    disableFlipByClick?: boolean;
    swipeDistance?: number;
  }

  export interface FlipEvent<T> {
    data: T;
    object: PageFlip;
  }

  export class PageFlip {
    constructor(element: HTMLElement, setting: FlipSetting);
    loadFromHTML(items: HTMLElement[]): void;
    on(event: 'flip', cb: (e: FlipEvent<number>) => void): this;
    on(event: 'changeState', cb: (e: FlipEvent<'user_fold' | 'fold_corner' | 'flipping' | 'read'>) => void): this;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    turnToPage(page: number): void;
    getCurrentPageIndex(): number;
    getPageCount(): number;
    update(): void;
    /** Gỡ cả phần tử khối đã truyền vào constructor. */
    destroy(): void;
  }
}
