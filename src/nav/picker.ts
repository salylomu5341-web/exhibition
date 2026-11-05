import * as THREE from 'three';

export type HitData =
  | { kind: 'standpoint'; x: number; z: number }
  | { kind: 'door' }
  | { kind: 'exhibit'; exhibitKey: string }
  | { kind: 'gong'; exhibitKey: string; index: number };

const raycaster = new THREE.Raycaster();
raycaster.far = 25;
const ndc = new THREE.Vector2();

/** Vật đầu tiên tia chạm trúng; vật không có `userData.hit` (như vách) chặn tia. */
export function pickHit(camera: THREE.Camera, targets: THREE.Object3D[], el: HTMLElement, clientX: number, clientY: number): HitData | null {
  const rect = el.getBoundingClientRect();
  ndc.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const first = raycaster.intersectObjects(targets, false)[0];
  return (first?.object.userData.hit as HitData | undefined) ?? null;
}
