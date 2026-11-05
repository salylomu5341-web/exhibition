import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { h } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

export function renderVideo(ex: ExhibitOf<'video'>): PanelContent {
  // Chỉ tạo iframe khi khung mở; gỡ iframe khi đóng để dừng phát.
  const frame = h('iframe', {
    src: `https://www.youtube-nocookie.com/embed/${ex.youtubeId}?rel=0&playsinline=1`,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    allowfullscreen: '',
    referrerpolicy: 'strict-origin-when-cross-origin',
  });
  const update = () => frame.setAttribute('title', t(ex.title));
  update();
  return { el: h('div', { class: 'p-video' }, frame), update, dispose: () => frame.remove() };
}
