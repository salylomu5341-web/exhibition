import * as THREE from 'three';
import { CSS3DObject, CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
import type { ExhibitOf } from '../content/schema';
import { youtubeFrame } from '../features/youtube';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h } from '../ui/dom';

/** Màn hình video trên vách: điểm giữa màn (con của nhóm hiện vật) và kích thước theo mét. */
export interface WallScreen {
  anchor: THREE.Object3D;
  width: number;
  height: number;
}

/** Số pixel CSS cho 1 m màn hình: iframe được dựng ở cỡ này rồi thu về đúng khung. */
const PX_PER_M = 320;
/** Màn video chiếm khoảng chừng này bề ngang (hoặc bề cao) khung nhìn khi đứng xem. */
const SCREEN_FILL = 0.7;
const MIN_DISTANCE = 1.3;

/** Khoảng cách tới vách để màn `width`×`height` m chiếm khoảng 70% khung nhìn của camera. */
export function fitDistance(fovDeg: number, aspect: number, width: number, height: number): number {
  const halfV = Math.tan(THREE.MathUtils.degToRad(fovDeg) / 2);
  const halfH = halfV * aspect;
  return Math.max(MIN_DISTANCE, width / (SCREEN_FILL * 2 * halfH), height / (SCREEN_FILL * 2 * halfV));
}

/**
 * Phát video YouTube ngay trong khung trên vách. Iframe đặt trên lớp CSS3D phủ lên canvas,
 * biến đổi theo camera; chỉ tồn tại khi đang phát, gỡ đi là dừng hẳn.
 */
export class WallVideo {
  private readonly renderer = new CSS3DRenderer();
  private readonly scene = new THREE.Scene();
  private readonly closeBtn: HTMLButtonElement;
  private current: { key: string; object: CSS3DObject; frame: HTMLIFrameElement; dispose: () => void; title: () => string } | null = null;
  private readonly toCamera = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly view = new THREE.Vector3();

  constructor(
    private readonly container: HTMLElement,
    uiEl: HTMLElement,
  ) {
    this.renderer.domElement.className = 'wall-video-layer';
    this.renderer.domElement.hidden = true;
    container.append(this.renderer.domElement);
    this.closeBtn = h('button', { type: 'button', class: 'wv-close' });
    this.closeBtn.hidden = true;
    this.closeBtn.addEventListener('click', () => this.stop());
    uiEl.append(this.closeBtn);
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.stop();
    });
    this.resize();
    this.relang();
  }

  get key(): string | null {
    return this.current?.key ?? null;
  }

  play(key: string, ex: ExhibitOf<'video'>, screen: WallScreen): void {
    this.stop();
    const { frame, dispose } = youtubeFrame(ex.youtubeId);
    const el = h('div', { class: 'wall-video' }, frame);
    el.style.width = `${screen.width * PX_PER_M}px`;
    el.style.height = `${screen.height * PX_PER_M}px`;

    const object = new CSS3DObject(el);
    screen.anchor.updateWorldMatrix(true, false);
    screen.anchor.matrixWorld.decompose(object.position, object.quaternion, object.scale);
    object.scale.setScalar(1 / PX_PER_M);
    this.scene.add(object);
    this.current = { key, object, frame, dispose, title: () => t(ex.title) };
    this.relang();
    this.renderer.domElement.hidden = false;
    this.closeBtn.hidden = false;
  }

  stop(): void {
    if (!this.current) return;
    this.current.dispose();
    this.scene.remove(this.current.object);
    this.current.object.element.remove();
    this.current = null;
    this.renderer.domElement.hidden = true;
    this.closeBtn.hidden = true;
  }

  relang(): void {
    this.closeBtn.textContent = `✕ ${t(UI.closeVideo)}`;
    this.current?.frame.setAttribute('title', this.current.title());
  }

  render(camera: THREE.PerspectiveCamera): void {
    if (!this.current) return;
    const { object } = this.current;
    // Lớp CSS nằm trên canvas: ẩn khi màn ở sau lưng camera hoặc khách nhìn từ mặt sau vách.
    this.toCamera.subVectors(camera.position, object.position);
    this.normal.set(0, 0, 1).applyQuaternion(object.quaternion);
    camera.getWorldDirection(this.view);
    object.visible = this.toCamera.dot(this.normal) > 0 && this.toCamera.dot(this.view) < 0;
    this.renderer.render(this.scene, camera);
  }

  private resize(): void {
    this.renderer.setSize(this.container.clientWidth || window.innerWidth, this.container.clientHeight || window.innerHeight);
  }
}
