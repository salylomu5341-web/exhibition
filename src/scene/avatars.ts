import * as THREE from 'three';
import { COLOR_COUNT } from '../presence/protocol';
import type { Visitor } from '../presence/roster';
import { FIGURE_TOP, HIP, SHOULDER, armGeometry, clothGeometry, fixedGeometry, legGeometry } from './avatar-model';
import { HALF_WIDTH } from './layout';

/** Màu áo lấy từ thổ cẩm M'Nông: chàm, đen, đỏ, nâu, vàng nghệ, trắng ngà. */
export const AVATAR_COLORS = ['#2f3e6b', '#2a2622', '#a8322a', '#6e4526', '#c9952a', '#e9e0cc'] as const;
if (AVATAR_COLORS.length !== COLOR_COUNT) throw new Error('AVATAR_COLORS phải có đủ COLOR_COUNT màu');

/** Hiện tối đa chừng này khách khác (chủ dự án: "làm nhẹ và vừa thôi"). */
export const MAX_AVATARS = 20;
/** Gần camera hơn thế này thì ẩn, để không thấy bên trong người khác khi đứng cùng chỗ. */
const HIDE_NEAR = 0.5;
/** Khách đứng sát mình (thường là cùng chỗ đứng): dời ra chếch phía trước, lệch trái/phải, để thấy mà không che màn hình. */
const KEEP_AWAY = 2.2;
const AHEAD = 2.6;
const ASIDE = 1.3;
const LABEL_Y = FIGURE_TOP;
/** Bước đi: nhịp (rad/giây) và góc vung chân, tay. */
const STEP_RATE = 7;
const LEG_SWING = 0.5;
const ARM_SWING = 0.4;

/** Lệch nhẹ mỗi khách theo id, để nhiều người cùng một chỗ đứng không chồng lên nhau. */
export function spreadOffset(id: string): { dx: number; dz: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  const u = (h >>> 0) / 2 ** 32;
  const angle = u * Math.PI * 2;
  const r = 0.8 + ((h >>> 8) % 100) / 166;
  return { dx: Math.cos(angle) * r, dz: Math.sin(angle) * r };
}

interface Tag {
  sprite: THREE.Sprite;
  canvas: HTMLCanvasElement;
  texture: THREE.CanvasTexture;
  text: string;
}

/**
 * Hình người của khách khác (xem avatar-model.ts): dùng chung hình và vật liệu, vẽ bằng InstancedMesh nên
 * 20 người cũng chỉ tốn bốn lần vẽ. Tay chân đung đưa khi đang đi. Thêm nhãn tên nhỏ trên đầu.
 */
export class Avatars {
  readonly group = new THREE.Group();
  private readonly fixed: THREE.InstancedMesh;
  private readonly cloth: THREE.InstancedMesh;
  private readonly arms: THREE.InstancedMesh;
  private readonly legs: THREE.InstancedMesh;
  private readonly tags: Tag[] = [];
  private readonly colors = AVATAR_COLORS.map((c) => new THREE.Color(c));
  private readonly m = new THREE.Matrix4();
  private readonly q = new THREE.Quaternion();
  private readonly up = new THREE.Vector3(0, 1, 0);
  private readonly p = new THREE.Vector3();
  private readonly one = new THREE.Vector3(1, 1, 1);
  private readonly limb = new THREE.Matrix4();
  private readonly joint = new THREE.Matrix4();
  private readonly swingM = new THREE.Matrix4();
  private readonly tiltM = new THREE.Matrix4();
  private time = 0;

  constructor(
    scene: THREE.Scene,
    private readonly nameOf: (n: number) => string,
  ) {
    const painted = new THREE.MeshLambertMaterial({ vertexColors: true });
    this.fixed = new THREE.InstancedMesh(fixedGeometry(), painted, MAX_AVATARS);
    this.cloth = new THREE.InstancedMesh(clothGeometry(), new THREE.MeshLambertMaterial({ color: '#ffffff' }), MAX_AVATARS);
    this.arms = new THREE.InstancedMesh(armGeometry(), painted, MAX_AVATARS * 2);
    this.legs = new THREE.InstancedMesh(legGeometry(), painted, MAX_AVATARS * 2);
    for (const mesh of [this.fixed, this.cloth, this.arms, this.legs]) {
      mesh.count = 0;
      // Các bản sao rải khắp nhà dài: khung bao của hình gốc không đúng, nên không cắt theo khung nhìn.
      mesh.frustumCulled = false;
    }
    this.group.name = 'visitors';
    this.group.add(this.fixed, this.cloth, this.arms, this.legs);
    scene.add(this.group);
  }

  get shownCount(): number {
    return this.cloth.count;
  }

  private tag(i: number): Tag {
    let tag = this.tags[i];
    if (!tag) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false }));
      sprite.scale.set(0.8, 0.2, 1);
      this.group.add(sprite);
      tag = { sprite, canvas, texture, text: '' };
      this.tags[i] = tag;
    }
    return tag;
  }

  private drawTag(tag: Tag, text: string): void {
    if (tag.text === text) return;
    tag.text = text;
    const ctx = tag.canvas.getContext('2d');
    if (!ctx) return;
    const { width: W, height: H } = tag.canvas;
    ctx.clearRect(0, 0, W, H);
    ctx.font = '600 30px "Be Vietnam Pro", "Segoe UI", Roboto, Arial, sans-serif';
    const w = Math.min(W - 4, ctx.measureText(text).width + 32);
    ctx.fillStyle = 'rgba(20, 14, 8, 0.72)';
    ctx.beginPath();
    ctx.roundRect((W - w) / 2, 8, w, H - 16, (H - 16) / 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + 1);
    tag.texture.needsUpdate = true;
  }

  /** Vẽ lại tên (đổi ngôn ngữ). */
  relang(): void {
    for (const tag of this.tags) tag.text = '';
  }

  update(visitors: Iterable<Visitor>, camera: { x: number; z: number; yaw: number }, dt: number): void {
    this.time += dt;
    let i = 0;
    for (const v of visitors) {
      if (i >= MAX_AVATARS) break;
      const pose = v.shown!;
      const { dx, dz } = spreadOffset(v.id);
      let x = pose.x + dx;
      let z = pose.z + dz;
      const d = Math.hypot(x - camera.x, z - camera.z);
      if (d <= HIDE_NEAR) continue;
      if (d < KEEP_AWAY) {
        // Camera nhìn theo -Z quay quanh trục Y một góc yaw: phía trước (-sin, -cos), bên phải (cos, -sin).
        // Màn hình dọc (điện thoại) nhìn hẹp ngang: đứng xa hơn, gần giữa hơn để vẫn trong khung.
        const narrow = typeof innerWidth === 'number' && innerWidth < innerHeight;
        const ahead = narrow ? AHEAD + 0.8 : AHEAD;
        const aside = (narrow ? ASIDE * 0.55 : ASIDE) * (dx >= 0 ? 1 : -1);
        const sin = Math.sin(camera.yaw);
        const cos = Math.cos(camera.yaw);
        x = camera.x - sin * ahead + cos * aside;
        z = Math.max(-HALF_WIDTH + 0.6, Math.min(HALF_WIDTH - 0.6, camera.z - cos * ahead - sin * aside));
      }
      // Đang đi: chân tay vung ngược nhau theo nhịp bước, người nhún nhẹ mỗi bước.
      const walking = v.path.length > 0;
      const phase = this.time * STEP_RATE + dx * 7;
      const swing = walking ? Math.sin(phase) : 0;
      const bob = walking ? Math.abs(Math.sin(phase)) * 0.035 : 0;
      this.q.setFromAxisAngle(this.up, pose.yaw);
      this.m.compose(this.p.set(x, bob, z), this.q, this.one);
      this.fixed.setMatrixAt(i, this.m);
      this.cloth.setMatrixAt(i, this.m);
      this.cloth.setColorAt(i, this.colors[v.meta!.c]);
      for (const side of [-1, 1]) {
        const k = i * 2 + (side < 0 ? 0 : 1);
        this.legs.setMatrixAt(k, this.attach(side * HIP.x, HIP.y, swing * LEG_SWING * side, 0));
        // Tay buông hơi chếch ra ngoài, vung ngược chiều chân cùng bên.
        this.arms.setMatrixAt(k, this.attach(side * SHOULDER.x, SHOULDER.y, -swing * ARM_SWING * side, side * 0.07));
      }
      const tag = this.tag(i);
      this.drawTag(tag, this.nameOf(v.meta!.n));
      tag.sprite.position.set(x, LABEL_Y + bob, z);
      tag.sprite.visible = true;
      i++;
    }
    for (let j = i; j < this.tags.length; j++) this.tags[j].sprite.visible = false;
    this.fixed.count = i;
    this.cloth.count = i;
    this.arms.count = i * 2;
    this.legs.count = i * 2;
    for (const mesh of [this.fixed, this.cloth, this.arms, this.legs]) mesh.instanceMatrix.needsUpdate = true;
    if (this.cloth.instanceColor) this.cloth.instanceColor.needsUpdate = true;
  }

  /** Ma trận tay/chân: vị trí người (this.m) → khớp (x, y) → nghiêng ra ngoài quanh Z → vung quanh X. */
  private attach(x: number, y: number, swing: number, tilt: number): THREE.Matrix4 {
    this.joint.makeTranslation(x, y, 0);
    this.tiltM.makeRotationZ(tilt);
    this.swingM.makeRotationX(swing);
    return this.limb.copy(this.m).multiply(this.joint).multiply(this.tiltM).multiply(this.swingM);
  }
}
