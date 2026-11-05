import * as THREE from 'three';
import type { HitData } from '../nav/picker';
import { standpoints } from '../scene/layout';

export function buildMarkers(scene: THREE.Scene): { targets: THREE.Object3D[]; update(time: number, camX: number, camZ: number): void } {
  const ringGeo = new THREE.RingGeometry(0.32, 0.42, 40);
  const hitGeo = new THREE.CircleGeometry(0.7, 24);
  const hitMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });

  const items = standpoints().map((sp) => {
    const material = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.7, depthWrite: false });
    const ring = new THREE.Mesh(ringGeo, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(sp.x, 0.03, sp.z);
    const hit = new THREE.Mesh(hitGeo, hitMat);
    hit.rotation.x = -Math.PI / 2;
    hit.position.set(sp.x, 0.02, sp.z);
    hit.visible = false; // Raycaster vẫn bắt trúng vật ẩn.
    const data: HitData = { kind: 'standpoint', x: sp.x, z: sp.z };
    ring.userData.hit = data;
    hit.userData.hit = data;
    scene.add(ring, hit);
    return { sp, material, ring, hit };
  });

  return {
    targets: items.flatMap((i) => [i.ring, i.hit]),
    update(time, camX, camZ) {
      for (const item of items) {
        const here = Math.hypot(item.sp.x - camX, item.sp.z - camZ) < 0.6;
        item.material.opacity = here ? 0 : 0.55 + 0.25 * Math.sin(time * 2.5);
      }
    },
  };
}
