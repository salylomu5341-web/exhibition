export interface ExhibitionHooks {
  mode: '3d' | 'text';
  readonly roomIndex: number;
  readonly openKey: string | null;
  goTo(index: number): void;
  open(key: string): void;
  /** Khách ảo: số người đang tham quan (0 khi chưa kết nối) và số hình người đang hiện. */
  readonly visitors?: { readonly count: number; readonly shown: number } | null;
}

declare global {
  interface Window {
    /** Dùng cho kiểm thử e2e và gỡ lỗi. */
    __exhibition?: ExhibitionHooks;
  }
}

export function installHooks(o: {
  mode: '3d' | 'text';
  getVisitors?: () => { readonly count: number; readonly shown: number } | null;
  getRoomIndex: () => number;
  getOpenKey: () => string | null;
  goTo: (index: number) => void;
  open: (key: string) => void;
}): void {
  window.__exhibition = {
    mode: o.mode,
    get roomIndex() {
      return o.getRoomIndex();
    },
    get openKey() {
      return o.getOpenKey();
    },
    get visitors() {
      return o.getVisitors?.() ?? null;
    },
    goTo: o.goTo,
    open: o.open,
  };
}
