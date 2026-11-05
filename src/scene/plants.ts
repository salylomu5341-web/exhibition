import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROOM_COUNT } from '../content/schema';
import { HALF_WIDTH, HALL_LENGTH, HOUSE_LENGTH, ROOM_LENGTH } from './layout';

/** Chỗ đặt chậu: x, z, độ cao mặt đặt (thềm gỗ cao hơn sàn). */
type Spot = [x: number, z: number, y: number];

const POT_Z = HALF_WIDTH - 0.75;

/**
 * Chậu cây trang trí: cạnh cột ở ranh giới các gian (chỗ vách trống giữa hai hiện vật),
 * hai góc sảnh, cuối nhà và hai bên cửa trên thềm. Không nhận chạm.
 */
export function plantSpots(): Spot[] {
  const spots: Spot[] = [
    [-0.55, -1.75, 0.12],
    [-0.55, 1.75, 0.12],
    [0.6, -POT_Z, 0],
    [0.6, POT_Z, 0],
    // Vách cuối nhà, hai bên lối giữa (góc nhà có thể có hiện vật ở ô thứ ba).
    [HOUSE_LENGTH - 0.6, -2.6, 0],
    [HOUSE_LENGTH - 0.6, 2.6, 0],
  ];
  for (let i = 0; i < ROOM_COUNT; i++) {
    const x = HALL_LENGTH + i * ROOM_LENGTH;
    spots.push([x, -POT_Z, 0], [x, POT_Z, 0]);
  }
  // Vách phải của sảnh còn trống.
  spots.push([3, POT_Z, 0]);
  return spots;
}

type Parts = Map<THREE.Material, THREE.BufferGeometry[]>;

const potMat = new THREE.MeshLambertMaterial({ color: '#9c5a3c' });
const rimMat = new THREE.MeshLambertMaterial({ color: '#6e3f28' });
const soilMat = new THREE.MeshLambertMaterial({ color: '#3b2a1a' });
const leafDark = new THREE.MeshLambertMaterial({ color: '#3f6e30', flatShading: true });
const leafLight = new THREE.MeshLambertMaterial({ color: '#6a9a45', flatShading: true });
const stemMat = new THREE.MeshLambertMaterial({ color: '#5b4a2a' });
const flowerRed = new THREE.MeshLambertMaterial({ color: '#c8323c' });
const flowerYellow = new THREE.MeshLambertMaterial({ color: '#e8b32a' });

/** Số giả ngẫu nhiên có hạt giống, để cây lần nào dựng cũng giống nhau. */
function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function add(parts: Parts, mat: THREE.Material, geo: THREE.BufferGeometry): void {
  const list = parts.get(mat) ?? [];
  list.push(geo);
  parts.set(mat, list);
}

function pot(parts: Parts): void {
  add(parts, potMat, new THREE.CylinderGeometry(0.26, 0.19, 0.44, 14).translate(0, 0.22, 0));
  add(parts, rimMat, new THREE.TorusGeometry(0.26, 0.03, 6, 18).rotateX(Math.PI / 2).translate(0, 0.44, 0));
  add(parts, soilMat, new THREE.CylinderGeometry(0.24, 0.24, 0.02, 14).translate(0, 0.42, 0));
}

/** Lá dài hình bầu dục, gốc ở (0, y, 0), chĩa ra theo góc `angle`, nghiêng lên `tilt`. */
function leaf(length: number, width: number, y: number, angle: number, tilt: number): THREE.BufferGeometry {
  return new THREE.SphereGeometry(1, 8, 4)
    .scale(width, 0.012, length / 2)
    .translate(0, 0, length / 2)
    .rotateX(-tilt)
    .rotateY(angle)
    .translate(0, y, 0);
}

/** Cây lá dài xòe như cau, cọ nhỏ. */
function palm(rand: () => number): Parts {
  const parts: Parts = new Map();
  pot(parts);
  for (let i = 0; i < 3; i++) {
    const h = 0.75 + i * 0.12;
    add(parts, stemMat, new THREE.CylinderGeometry(0.012, 0.02, h - 0.4, 5).translate((i - 1) * 0.04, 0.4 + (h - 0.4) / 2, 0));
  }
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + rand() * 0.4;
    const tilt = 0.25 + rand() * 0.7;
    const mat = i % 2 ? leafDark : leafLight;
    add(parts, mat, leaf(0.42 + rand() * 0.2, 0.07, 0.75 + rand() * 0.25, angle, tilt));
  }
  return parts;
}

/** Bụi cây tròn có hoa đỏ, vàng. */
function flowering(rand: () => number): Parts {
  const parts: Parts = new Map();
  pot(parts);
  const clumps: Array<[number, number, number, number]> = [
    [0, 0.72, 0, 0.26],
    [0.14, 0.6, 0.08, 0.2],
    [-0.13, 0.62, -0.06, 0.21],
    [0.04, 0.6, -0.15, 0.19],
    [-0.06, 0.88, 0.05, 0.17],
  ];
  clumps.forEach(([x, y, z, r], i) => add(parts, i % 2 ? leafLight : leafDark, new THREE.SphereGeometry(r, 7, 5).translate(x, y, z)));
  for (let i = 0; i < 20; i++) {
    const a = rand() * Math.PI * 2;
    const up = 0.15 + rand() * 0.85;
    const r = 0.27 * Math.sqrt(1 - up * up * 0.6);
    const flower = new THREE.SphereGeometry(0.045, 6, 4).translate(Math.cos(a) * r, 0.68 + up * 0.25, Math.sin(a) * r);
    add(parts, i % 3 ? flowerRed : flowerYellow, flower);
  }
  return parts;
}

/** Gộp từng loại cây thành vài InstancedMesh (mỗi vật liệu một lần vẽ). */
export function buildPlants(scene: THREE.Scene): void {
  const rand = seeded(7);
  const spots = plantSpots();
  const kinds = [palm(rand), flowering(rand)];
  kinds.forEach((parts, k) => {
    // Hai chậu đối nhau qua lối đi cùng một loại cây.
    const mine = spots.filter((_, i) => Math.floor(i / 2) % kinds.length === k);
    const matrix = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    const placements = mine.map(([x, z, y]) => {
      const s = 1.2 + rand() * 0.25;
      return matrix.compose(new THREE.Vector3(x, y, z), q.setFromAxisAngle(up, rand() * Math.PI * 2), new THREE.Vector3(s, s, s)).clone();
    });
    for (const [mat, geos] of parts) {
      const merged = mergeGeometries(geos);
      geos.forEach((g) => g.dispose());
      if (!merged) continue;
      const mesh = new THREE.InstancedMesh(merged, mat, placements.length);
      placements.forEach((m, i) => mesh.setMatrixAt(i, m));
      mesh.computeBoundingSphere();
      scene.add(mesh);
    }
  });
}
