import { describe, expect, it, vi } from 'vitest';
import { attachKeys, attachPointer } from '../../src/nav/input';

type Listener = (e: Record<string, unknown>) => void;

/** Đích sự kiện giả, đủ cho attachPointer/attachKeys mà không cần DOM. */
function fakeTarget() {
  const listeners = new Map<string, Listener[]>();
  return {
    addEventListener(type: string, fn: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), fn]);
    },
    setPointerCapture() {},
    fire(type: string, e: Record<string, unknown> = {}) {
      listeners.get(type)?.forEach((fn) => fn(e));
    },
  };
}

const ptr = (pointerId: number, clientX = 10, clientY = 10) => ({ pointerId, clientX, clientY, pointerType: 'touch', button: 0 });

describe('attachPointer', () => {
  const setup = () => {
    const el = fakeTarget();
    const onTap = vi.fn();
    const onLook = vi.fn();
    attachPointer(el as unknown as HTMLElement, { onTap, onLook });
    return { el, onTap, onLook };
  };

  it('chạm một ngón gọi onTap', () => {
    const { el, onTap } = setup();
    el.fire('pointerdown', ptr(1));
    el.fire('pointerup', ptr(1));
    el.fire('lostpointercapture', ptr(1));
    expect(onTap).toHaveBeenCalledTimes(1);
    expect(onTap).toHaveBeenCalledWith(10, 10);
  });

  it('ngón thứ hai (chụm) huỷ cú chạm', () => {
    const { el, onTap } = setup();
    el.fire('pointerdown', ptr(1));
    el.fire('pointerdown', ptr(2, 50, 50));
    el.fire('pointerup', ptr(2, 50, 50));
    el.fire('pointerup', ptr(1));
    expect(onTap).not.toHaveBeenCalled();
  });

  it('mất pointer capture thì huỷ cú chạm', () => {
    const { el, onTap } = setup();
    el.fire('pointerdown', ptr(1));
    el.fire('lostpointercapture', ptr(1));
    el.fire('pointerup', ptr(1));
    expect(onTap).not.toHaveBeenCalled();
  });
});

describe('attachKeys', () => {
  const key = (k: string, extra: Record<string, unknown> = {}) => ({ key: k, target: null, ...extra });

  it('bỏ qua phím có Ctrl/Alt/Meta', () => {
    const win = fakeTarget();
    const keys = attachKeys(win as unknown as Window);
    win.fire('keydown', key('w', { ctrlKey: true }));
    win.fire('keydown', key('s', { altKey: true }));
    win.fire('keydown', key('d', { metaKey: true }));
    expect(keys.axis()).toEqual({ forward: 0, strafe: 0 });
    win.fire('keydown', key('w'));
    expect(keys.axis()).toEqual({ forward: 1, strafe: 0 });
  });

  /** Phần tử giả: closest() trả về khớp khi bộ chọn có chứa một trong các lớp tổ tiên. */
  const elIn = (tagName: string, ...ancestors: string[]) => ({
    tagName,
    closest: (sel: string) => (sel.split(',').some((s) => ancestors.includes(s.trim())) ? {} : null),
  });

  it('bỏ qua phím mũi tên khi tiêu điểm nằm trong khung thông tin hoặc danh sách gian', () => {
    const win = fakeTarget();
    const keys = attachKeys(win as unknown as Window);
    win.fire('keydown', key('ArrowUp', { target: elIn('DIV', '.panel', '#ui') }));
    win.fire('keydown', key('ArrowLeft', { target: elIn('BUTTON', '.roomlist', '#ui') }));
    expect(keys.axis()).toEqual({ forward: 0, strafe: 0 });
    win.fire('keydown', key('ArrowUp', { target: elIn('CANVAS') }));
    expect(keys.axis()).toEqual({ forward: 1, strafe: 0 });
  });

  it('WASD vẫn đi khi tiêu điểm còn ở nút thanh trên / thanh gian', () => {
    const win = fakeTarget();
    const keys = attachKeys(win as unknown as Window);
    win.fire('keydown', key('w', { target: elIn('BUTTON', '.lang', '.topbar', '#ui') }));
    win.fire('keydown', key('d', { target: elIn('BUTTON', '.roombar', '#ui') }));
    expect(keys.axis()).toEqual({ forward: 1, strafe: 1 });
  });
});
