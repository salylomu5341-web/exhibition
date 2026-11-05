import type * as THREE from 'three';
import type { Room, Site } from '../content/schema';
import { t } from '../i18n/lang';
import { makeLabel, type Label, type LabelOptions } from '../scene/label';
import { HALF_WIDTH, roomStartX } from '../scene/layout';

const DARK: Pick<LabelOptions, 'bg' | 'fg'> = { bg: '#3b2a1a', fg: '#f3e6cc' };

export function buildSigns(scene: THREE.Scene, site: Site, rooms: Room[]): { relang(): void } {
  const bindings: Array<{ label: Label; text: () => string }> = [];
  const add = (text: () => string, opts: LabelOptions, x: number, y: number, z: number, rotationY: number) => {
    const label = makeLabel(text(), opts);
    label.mesh.position.set(x, y, z);
    label.mesh.rotation.y = rotationY;
    scene.add(label.mesh);
    bindings.push({ label, text });
  };

  // Biển trên cửa, nhìn ra sân (−x)
  add(() => t(site.name), { width: 4.2, height: 0.6, fontPx: 52, ...DARK }, -0.1, 2.8, 0, -Math.PI / 2);

  // Lời chào trên vách trái của sảnh
  add(
    () => `${t(site.name)}\n${t(site.welcome)}`,
    { width: 3.4, height: 1.9, bg: '#f3e6cc', fg: '#3b2a1a', fontPx: 34, align: 'left', heading: true },
    3,
    1.7,
    -HALF_WIDTH + 0.1,
    0,
  );

  // Tên gian treo dưới xà, quay về phía khách đi tới (−x)
  for (const room of rooms) {
    add(() => `${room.order}. ${t(room.name)}`, { width: 3.4, height: 0.5, fontPx: 44, ...DARK }, roomStartX(room.order) + 0.2, 2.7, 0, -Math.PI / 2);
  }

  return { relang: () => bindings.forEach((b) => b.label.setText(b.text())) };
}
