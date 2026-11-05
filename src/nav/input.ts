export interface PointerHandlers {
  onTap(clientX: number, clientY: number): void;
  onLook(dx: number, dy: number): void;
}

const TAP_SLOP = 8;

export function attachPointer(el: HTMLElement, handlers: PointerHandlers): void {
  let active: { id: number; startX: number; startY: number; lastX: number; lastY: number; dragging: boolean } | null = null;

  el.addEventListener('pointerdown', (e) => {
    // Ngón thứ hai (chụm/zoom) huỷ cú chạm của ngón đầu.
    if (active) {
      active.dragging = true;
      return;
    }
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    active = { id: e.pointerId, startX: e.clientX, startY: e.clientY, lastX: e.clientX, lastY: e.clientY, dragging: false };
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!active || e.pointerId !== active.id) return;
    if (!active.dragging && Math.hypot(e.clientX - active.startX, e.clientY - active.startY) > TAP_SLOP) active.dragging = true;
    if (active.dragging) handlers.onLook(e.clientX - active.lastX, e.clientY - active.lastY);
    active.lastX = e.clientX;
    active.lastY = e.clientY;
  });

  const end = (e: PointerEvent, cancelled: boolean) => {
    if (!active || e.pointerId !== active.id) return;
    if (!active.dragging && !cancelled) handlers.onTap(e.clientX, e.clientY);
    active = null;
  };
  el.addEventListener('pointerup', (e) => end(e, false));
  el.addEventListener('pointercancel', (e) => end(e, true));
  el.addEventListener('lostpointercapture', (e) => end(e, true));
}

export interface KeyAxis {
  forward: number;
  strafe: number;
}

export function axisFromKeys(down: ReadonlySet<string>): KeyAxis {
  const forward = (down.has('w') || down.has('arrowup') ? 1 : 0) - (down.has('s') || down.has('arrowdown') ? 1 : 0);
  const strafe = (down.has('d') || down.has('arrowright') ? 1 : 0) - (down.has('a') || down.has('arrowleft') ? 1 : 0);
  return { forward, strafe };
}

export function attachKeys(target: Window = window): { axis(): KeyAxis } {
  const down = new Set<string>();
  target.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const el = e.target as HTMLElement | null;
    if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
    // Phím mũi tên dùng để cuộn/chọn trong khung thông tin và danh sách gian, không đi camera.
    // WASD vẫn đi được kể cả khi tiêu điểm còn ở nút giao diện vừa bấm.
    if (e.key.startsWith('Arrow') && (e.target as Element | null)?.closest?.('.panel, .roomlist')) return;
    down.add(e.key.toLowerCase());
  });
  target.addEventListener('keyup', (e) => down.delete(e.key.toLowerCase()));
  target.addEventListener('blur', () => down.clear());
  return { axis: () => axisFromKeys(down) };
}
