import type * as THREE from 'three';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { PresenceClient, randomId } from '../presence/client';
import { REALTIME_KEY, REALTIME_URL } from '../presence/config';
import { COLOR_COUNT, MAX_NUMBER, parseMeta, type Pose, type VisitorMeta } from '../presence/protocol';
import { Avatars } from '../scene/avatars';
import { h } from '../ui/dom';

const STORAGE_KEY = 'mnong-visitor';

export interface Visitors {
  /** Nút đếm người, đặt vào thanh trên. */
  button: HTMLButtonElement;
  /** Gọi mỗi khung hình; `moving`: đang đi (tween hoặc giữ phím), chưa gửi vị trí. */
  update(pose: Pose, moving: boolean, dt: number): void;
  relang(): void;
  readonly count: number;
  readonly shown: number;
}

/** Giữ tên và màu trong phiên (tải lại trang vẫn là "Khách 12"). */
function myIdentity(): { id: string; meta: VisitorMeta } {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as { id?: unknown; n?: unknown; c?: unknown } | null;
    const meta = saved && parseMeta(saved);
    if (saved && typeof saved.id === 'string' && /^[a-z0-9]{8,40}$/.test(saved.id) && meta) return { id: saved.id, meta };
  } catch {
    // Trình duyệt chặn lưu trữ: dùng tên mới.
  }
  const id = randomId();
  const meta = { n: 1 + Math.floor(Math.random() * MAX_NUMBER), c: Math.floor(Math.random() * COLOR_COUNT) };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ id, ...meta }));
  } catch {
    // Bỏ qua.
  }
  return { id, meta };
}

/**
 * "Khách ảo": ai đang xem nhà dài 3D thì hiện thành hình người ở chỗ họ đứng.
 * Supabase Realtime lỗi hay bị chặn thì nút đếm không hiện và nhà dài chạy như cũ.
 */
export function startVisitors(scene: THREE.Scene): Visitors {
  const { id, meta } = myIdentity();
  const avatars = new Avatars(scene, (n) => t(UI.visitorName).replace('{n}', String(n)));
  const countEl = h('span', { class: 'tb-count' });
  const textEl = h('span', { class: 'tb-text' });
  const button = h('button', { type: 'button', class: 'tb-btn tb-visitors', 'aria-pressed': 'true' }, h('span', { 'aria-hidden': 'true' }, '👥'), countEl, textEl);
  button.hidden = true;
  let showOthers = true;

  const client = new PresenceClient({ url: REALTIME_URL, apiKey: REALTIME_KEY, id, meta, onChange: () => render() });

  function render(): void {
    button.hidden = !client.joined;
    const n = client.roster.count;
    countEl.textContent = String(n);
    textEl.textContent = ` ${t(UI.visitorsOnline)}`;
    button.setAttribute('aria-pressed', String(showOthers));
    button.setAttribute('aria-label', `${n} ${t(UI.visitorsOnline)}. ${t(showOthers ? UI.hideVisitors : UI.showVisitors)}`);
    button.title = t(showOthers ? UI.hideVisitors : UI.showVisitors);
  }

  button.addEventListener('click', () => {
    showOthers = !showOthers;
    avatars.group.visible = showOthers;
    render();
  });

  render();
  client.start();
  addEventListener('pagehide', () => client.stop());
  // Quay lại trang từ bộ nhớ đệm (nút Back): kết nối lại.
  addEventListener('pageshow', (e) => {
    if (e.persisted) client.start();
  });

  return {
    button,
    update(pose, moving, dt) {
      try {
        client.tick(pose, moving, performance.now());
        client.roster.update(dt);
        avatars.update(client.roster.present(), pose, dt);
      } catch (err) {
        // Không để lỗi khách ảo làm dừng vòng vẽ.
        console.warn(err);
      }
    },
    relang() {
      avatars.relang();
      render();
    },
    get count() {
      return client.joined ? client.roster.count : 0;
    },
    get shown() {
      return showOthers ? avatars.shownCount : 0;
    },
  };
}
