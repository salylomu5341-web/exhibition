import { YT_ENDED, youtubeFrame } from '../features/youtube';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from './dom';

/**
 * Video giới thiệu toàn màn hình trước khi vào nhà dài. Phải gọi trong lượt bấm của khách để có tiếng.
 * Hết video, bấm "Bỏ qua" hoặc Esc thì gỡ video và gọi `onDone` (một lần).
 */
export function playIntroVideo(host: HTMLElement, youtubeId: string, onDone: () => void): void {
  let finished = false;
  const { frame, dispose } = youtubeFrame(youtubeId, (state) => {
    if (state === YT_ENDED) finish();
  });
  frame.title = t(UI.introVideo);
  const skip = h('button', { type: 'button', class: 'iv-skip' }, `${t(UI.skipIntro)} ›`);
  const el = h('div', { class: 'intro-video', role: 'dialog', 'aria-modal': 'true', 'aria-label': t(UI.introVideo) }, h('div', { class: 'iv-frame' }, frame), skip);
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') finish();
  };

  function finish(): void {
    if (finished) return;
    finished = true;
    dispose();
    document.removeEventListener('keydown', onKey);
    el.remove();
    onDone();
  }

  skip.addEventListener('click', finish);
  document.addEventListener('keydown', onKey);
  host.append(el);
  skip.focus({ preventScroll: true });
}
