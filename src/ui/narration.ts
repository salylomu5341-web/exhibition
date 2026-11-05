import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';
import type { PanelContent } from './panel';

const audio = typeof Audio === 'undefined' ? null : new Audio();
let currentSrc: string | null = null;
const failed = new Set<string>();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

audio?.addEventListener('ended', () => {
  currentSrc = null;
  emit();
});
audio?.addEventListener('error', () => {
  if (currentSrc) failed.add(currentSrc);
  currentSrc = null;
  emit();
});

export function playNarration(src: string): void {
  if (!audio) return;
  audio.src = src;
  currentSrc = src;
  audio.play().catch(() => {
    // Có thể đã chuyển sang giọng khác trước khi lời hứa bị từ chối.
    if (currentSrc !== src) return;
    currentSrc = null;
    emit();
  });
  emit();
}

export function stopNarration(): void {
  if (!audio || !currentSrc) return;
  audio.pause();
  currentSrc = null;
  emit();
}

/** Nút ▶/■ thuyết minh; ẩn khi ngôn ngữ đang chọn không có file. */
export function narrationButton(getSrc: () => string | null): PanelContent {
  const el = h('button', { type: 'button', class: 'btn narr' });
  el.addEventListener('click', () => {
    const src = getSrc();
    if (!src) return;
    if (currentSrc === src) stopNarration();
    else playNarration(src);
  });
  const render = () => {
    const src = getSrc();
    el.hidden = !src;
    if (!src) return;
    el.disabled = failed.has(src);
    el.textContent = failed.has(src) ? t(UI.audioError) : currentSrc === src ? `■ ${t(UI.stop)}` : `▶ ${t(UI.listen)}`;
  };
  listeners.add(render);
  render();
  return {
    el,
    update: () => {
      // Đổi ngôn ngữ: dừng giọng cũ.
      if (currentSrc && currentSrc !== getSrc()) stopNarration();
      render();
    },
    dispose: () => {
      listeners.delete(render);
      if (currentSrc && currentSrc === getSrc()) stopNarration();
    },
  };
}
