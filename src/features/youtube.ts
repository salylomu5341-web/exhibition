import { h } from '../ui/dom';

export const YT_ORIGIN = 'https://www.youtube-nocookie.com';
/** Trạng thái trình phát YouTube (IFrame API). */
export const YT_ENDED = 0;
export const YT_PLAYING = 1;

/**
 * Iframe YouTube gọn: tự phát, không thanh điều khiển, không nút toàn màn hình, không chú thích; bấm vào video để dừng/chạy.
 * Tạo ngay trong lượt bấm của khách để trình duyệt cho tự phát có tiếng; nếu vẫn bị chặn, khách bấm nút phát của YouTube.
 * `onState` nhận trạng thái trình phát (YT_ENDED, YT_PLAYING…). Gọi `dispose()` khi gỡ iframe.
 */
export function youtubeFrame(youtubeId: string, onState?: (state: number) => void): { frame: HTMLIFrameElement; dispose(): void } {
  const params = new URLSearchParams({
    autoplay: '1',
    rel: '0',
    playsinline: '1',
    controls: '0',
    fs: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    enablejsapi: '1',
    origin: location.origin,
  });
  const frame = h('iframe', {
    src: `${YT_ORIGIN}/embed/${youtubeId}?${params}`,
    allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
    allowfullscreen: '',
    referrerpolicy: 'strict-origin-when-cross-origin',
  });
  const send = (msg: unknown) => frame.contentWindow?.postMessage(JSON.stringify(msg), YT_ORIGIN);
  // Đăng ký nghe tin từ trình phát (trạng thái, sẵn sàng).
  frame.addEventListener('load', () => send({ event: 'listening', id: youtubeId, channel: 'widget' }));

  // YouTube vẫn bật phụ đề nếu tài khoản khách đã bật sẵn (cc_load_policy=0 không chặn được),
  // nên gỡ hẳn mô-đun phụ đề khi trình phát sẵn sàng và mỗi lần bắt đầu chạy.
  const onMessage = (e: MessageEvent) => {
    if (e.origin !== YT_ORIGIN || e.source !== frame.contentWindow || typeof e.data !== 'string') return;
    let msg: { event?: string; info?: { playerState?: number } | null };
    try {
      msg = JSON.parse(e.data);
    } catch {
      return;
    }
    const state = msg.event === 'infoDelivery' ? msg.info?.playerState : undefined;
    if (msg.event === 'onReady' || state === YT_PLAYING) send({ event: 'command', func: 'unloadModule', args: ['captions'] });
    if (state !== undefined) onState?.(state);
  };
  window.addEventListener('message', onMessage);
  return { frame, dispose: () => window.removeEventListener('message', onMessage) };
}
