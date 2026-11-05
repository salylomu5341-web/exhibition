import type { SoundPlayer } from './sound';

export interface PanelCtx {
  player: SoundPlayer;
  /** Gọi khi khách bấm chiêng thứ `index` trong khung, để chiêng 3D rung theo. */
  onGong(index: number): void;
}
