import * as THREE from 'three';
import type { Exhibit, ExhibitOf, Room } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import type { HitData } from '../nav/picker';
import { makeLabel, type Label, type LabelOptions } from '../scene/label';
import { exhibitAnchor, type Anchor } from '../scene/layout';
import type { LazyImages } from '../scene/textures';
import type { WallScreen } from '../scene/wall-video';
import { bodyText, excerpt } from '../util/text';

export interface BuiltExhibit {
  key: string;
  room: Room;
  exhibit: Exhibit;
  object: THREE.Group;
  hitTargets: THREE.Object3D[];
  anchor: Anchor;
  /** Chỉ hiện vật video: màn hình trên vách để phát ngay trong khung. */
  screen?: WallScreen;
  relang(): void;
  update(dt: number, time: number): void;
  setActive(active: boolean): void;
  swing(index: number): void;
}

interface Extra {
  screen?: WallScreen;
  update?(dt: number, time: number): void;
  swing?(index: number): void;
}

type AddLabel = (text: () => string, opts: LabelOptions, x: number, y: number, z?: number) => Label;

const woodMat = new THREE.MeshLambertMaterial({ color: '#6b4a2b' });
const brassMat = new THREE.MeshStandardMaterial({ color: '#b8893a', metalness: 0.4, roughness: 0.45 });
const PAPER = '#f3e6cc';
const INK = '#3b2a1a';

function frame(group: THREE.Group, w: number, h: number, cy: number): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w + 0.14, h + 0.14, 0.05), woodMat);
  mesh.position.set(0, cy, 0.03);
  group.add(mesh);
}

function imagePlane(group: THREE.Group, images: LazyImages, roomOrder: number, url: string, w: number, h: number, x: number, y: number): void {
  const material = new THREE.MeshBasicMaterial({ color: '#d8c7a8' });
  images.add(roomOrder, url, material);
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  mesh.position.set(x, y, 0.06);
  group.add(mesh);
}

export function exhibitKey(room: Room, ex: Exhibit): string {
  return `${room.slug}/${ex.id}`;
}

export function buildExhibit(room: Room, ex: Exhibit, images: LazyImages): BuiltExhibit {
  const key = exhibitKey(room, ex);
  const anchor = exhibitAnchor(room.order, ex.position.wall, ex.position.slot);
  const group = new THREE.Group();
  group.position.set(anchor.x, 0, anchor.z);
  group.rotation.y = anchor.facing;

  const glowMat = new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0, depthWrite: false });
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.3), glowMat);
  glow.position.set(0, 1.65, 0.005);
  group.add(glow);

  const labels: Array<{ label: Label; text: () => string }> = [];
  const addLabel: AddLabel = (text, opts, x, y, z = 0.06) => {
    const label = makeLabel(text(), opts);
    label.mesh.position.set(x, y, z);
    group.add(label.mesh);
    labels.push({ label, text });
    return label;
  };

  const extra = buildByType(ex, room, group, images, addLabel, key);

  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== glow && !obj.userData.hit) {
      obj.userData.hit = { kind: 'exhibit', exhibitKey: key } satisfies HitData;
    }
  });
  const hitTargets: THREE.Object3D[] = [];
  group.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh && obj !== glow) hitTargets.push(obj);
  });

  let active = false;
  return {
    key,
    room,
    exhibit: ex,
    object: group,
    hitTargets,
    anchor,
    screen: extra.screen,
    relang: () => labels.forEach((l) => l.label.setText(l.text())),
    update: (dt, time) => {
      glow.visible = active;
      if (active) glowMat.opacity = 0.2 + 0.12 * Math.sin(time * 3);
      extra.update?.(dt, time);
    },
    setActive: (value) => {
      active = value;
    },
    swing: (index) => extra.swing?.(index),
  };
}

function buildByType(ex: Exhibit, room: Room, group: THREE.Group, images: LazyImages, addLabel: AddLabel, key: string): Extra {
  switch (ex.type) {
    case 'board':
      frame(group, 2.0, 1.4, 1.6);
      addLabel(
        () => `${t(ex.title)}\n${excerpt(bodyText(t(ex.body)), 150)}\n\n▶ ${t(UI.tapToView)}`,
        { width: 2.0, height: 1.4, bg: PAPER, fg: INK, fontPx: 34, align: 'left', heading: true },
        0,
        1.6,
      );
      return {};

    case 'gallery':
      ex.images.slice(0, 3).forEach((img, i) => {
        const x = (i - 1) * 0.9;
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.66, 0.05), woodMat);
        m.position.set(x, 1.75, 0.03);
        group.add(m);
        imagePlane(group, images, room.order, img.src, 0.78, 0.58, x, 1.75);
      });
      addLabel(() => t(ex.title), { width: 2.6, height: 0.3, bg: INK, fg: PAPER, fontPx: 36 }, 0, 1.22);
      return {};

    case 'video': {
      frame(group, 2.0, 1.125, 1.7);
      addLabel(() => t(ex.title), { width: 2.0, height: 1.125, bg: '#111111', fg: '#ffffff', fontPx: 36, variant: 'screen' }, 0, 1.7);
      const anchor = new THREE.Object3D();
      anchor.position.set(0, 1.7, 0.07);
      group.add(anchor);
      return { screen: { anchor, width: 2.0, height: 1.125 } };
    }

    case 'gongs':
      return buildGongs(ex, room, group, images, addLabel, key);

    case 'ar': {
      const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.0, 0.7), woodMat);
      pedestal.position.set(0, 0.5, 0.8);
      group.add(pedestal);
      const geo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 40);
      geo.rotateX(Math.PI / 2);
      geo.rotateZ(Math.PI / 2);
      // Hai mặt dán ảnh chiêng (poster), vành giữ màu đồng.
      let faceMat: THREE.Material = brassMat;
      if (ex.poster) {
        const face = new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.2, roughness: 0.5 });
        images.add(room.order, ex.poster, face);
        faceMat = face;
      }
      const preview = new THREE.Mesh(geo, [brassMat, faceMat, faceMat]);
      preview.position.set(0, 1.35, 0.8);
      group.add(preview);
      addLabel(() => `AR · ${t(ex.title)}`, { width: 1.8, height: 0.45, bg: INK, fg: PAPER, fontPx: 40 }, 0, 2.3);
      return {
        update: (_dt, time) => {
          preview.rotation.y = time * 0.8;
        },
      };
    }

    case 'costume': {
      frame(group, 1.1, 1.47, 1.45);
      imagePlane(group, images, room.order, ex.costumes[0].thumb, 1.1, 1.47, 0, 1.45);
      addLabel(() => `${t(UI.photoCorner)} · ${t(ex.title)}`, { width: 2.2, height: 0.4, bg: '#e2572b', fg: '#ffffff', fontPx: 40 }, 0, 2.45);
      return {};
    }

    case 'quiz':
      frame(group, 2.4, 1.6, 1.6);
      addLabel(
        () => `?\n${t(ex.title)}\n${t(UI.tapToStart)}`,
        { width: 2.4, height: 1.6, bg: '#e2572b', fg: '#ffffff', fontPx: 48, heading: true },
        0,
        1.6,
      );
      return {};
  }
}

function buildGongs(ex: ExhibitOf<'gongs'>, room: Room, group: THREE.Group, images: LazyImages, addLabel: AddLabel, key: string): Extra {
  const RACK_Z = 0.5;
  for (const x of [-1.5, 1.5]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.25, 0.08), woodMat);
    post.position.set(x, 1.125, RACK_Z);
    group.add(post);
  }
  const bar = new THREE.Mesh(new THREE.BoxGeometry(3.1, 0.08, 0.08), woodMat);
  bar.position.set(0, 2.2, RACK_Z);
  group.add(bar);
  addLabel(() => `${t(ex.title)} · ${t(UI.tapGong)}`, { width: 2.8, height: 0.32, bg: INK, fg: PAPER, fontPx: 34 }, 0, 2.5, RACK_Z);

  const gongGeo = new THREE.CylinderGeometry(0.21, 0.21, 0.05, 40);
  gongGeo.rotateX(Math.PI / 2);
  // Nắp trên có u theo z, v theo x; sau rotateX ảnh bị xoay 90°, xoay thêm quanh Z để ảnh đứng thẳng.
  gongGeo.rotateZ(Math.PI / 2);
  const cordGeo = new THREE.CylinderGeometry(0.006, 0.006, 0.36, 6);

  const pivots = ex.gongs.map((g, i) => {
    const face = new THREE.MeshStandardMaterial({ color: '#c9a24a', metalness: 0.2, roughness: 0.5 });
    images.add(room.order, g.image, face);
    const pivot = new THREE.Group();
    pivot.position.set(-1.25 + i * 0.5, 2.16, RACK_Z);
    const cord = new THREE.Mesh(cordGeo, brassMat);
    cord.position.y = -0.18;
    const gong = new THREE.Mesh(gongGeo, [brassMat, face, brassMat]);
    gong.position.y = -0.57;
    gong.userData.hit = { kind: 'gong', exhibitKey: key, index: i } satisfies HitData;
    pivot.add(cord, gong);
    group.add(pivot);
    return pivot;
  });

  const amplitudes = pivots.map(() => 0);
  return {
    update: (dt, time) => {
      pivots.forEach((pivot, i) => {
        amplitudes[i] *= Math.exp(-dt * 2.2);
        pivot.rotation.x = amplitudes[i] * Math.sin(time * 8 + i);
      });
    },
    swing: (index) => {
      amplitudes[index] = 0.22;
    },
  };
}
