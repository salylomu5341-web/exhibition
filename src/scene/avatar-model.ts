import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Hình người khách ảo, cao khoảng 1,65 m, mặt nhìn theo -Z (cùng hướng camera khi yaw = 0).
 * Chia bốn phần để vẽ bằng InstancedMesh: thân có màu cố định (đầu, tóc, cổ, viền thổ cẩm),
 * trang phục (áo, váy/khố) nhuộm theo từng khách, và tay, chân có khớp ở vai, hông để đung đưa khi đi.
 */

const SKIN = '#a8714b';
const HAIR = '#1d1410';
const TRIM = '#b3332a';
const CREAM = '#ead9b6';
const FOOT = '#2a1d14';

/** Hông và vai: gốc quay của chân, tay (toạ độ trong hình người). */
export const HIP = { y: 0.82, x: 0.09 };
export const SHOULDER = { y: 1.36, x: 0.235 };
/** Độ cao đặt nhãn tên. */
export const FIGURE_TOP = 1.95;

/** Bè ngực, váy theo chiều trước–sau cho ra dáng người, không tròn như ống. */
const FLAT = 0.72;

function paint(geo: THREE.BufferGeometry, color: string): THREE.BufferGeometry {
  const c = new THREE.Color(color);
  const n = geo.getAttribute('position').count;
  const colors = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) colors.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

const at = (geo: THREE.BufferGeometry, x: number, y: number, z: number) => geo.translate(x, y, z);

/** Ống thon: bán kính trên/dưới, từ y0 lên y1. */
function tube(rTop: number, rBottom: number, y0: number, y1: number, segments = 14): THREE.BufferGeometry {
  return at(new THREE.CylinderGeometry(rTop, rBottom, y1 - y0, segments), 0, (y0 + y1) / 2, 0);
}

function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const geo = mergeGeometries(parts);
  if (!geo) throw new Error('không ghép được hình người');
  parts.forEach((p) => p.dispose());
  return geo;
}

/** Đầu, cổ, tóc, viền thổ cẩm (màu theo đỉnh, không đổi theo khách). */
export function fixedGeometry(): THREE.BufferGeometry {
  const head = paint(at(new THREE.SphereGeometry(0.115, 16, 12).scale(0.92, 1.1, 1), 0, 1.575, 0), SKIN);
  const neck = paint(tube(0.048, 0.055, 1.39, 1.5, 10), SKIN);
  // Tóc: chỏm đầu và phía sau gáy, chừa mặt phía trước.
  const cap = paint(
    at(new THREE.SphereGeometry(0.123, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.5).scale(0.94, 1.1, 1.02), 0, 1.585, 0.006),
    HAIR,
  );
  const back = paint(at(new THREE.SphereGeometry(0.118, 14, 10, Math.PI * 0.15, Math.PI * 0.7, Math.PI * 0.45, Math.PI * 0.35).scale(0.95, 1.1, 1), 0, 1.575, 0.012), HAIR);
  const band = (y: number, r: number, h: number, color: string) => paint(tube(r, r, y - h / 2, y + h / 2).scale(1, 1, FLAT), color);
  // Hai mắt ở mặt trước (-Z).
  const eye = (x: number) => paint(at(new THREE.SphereGeometry(0.014, 8, 6), x, 1.585, -0.104), HAIR);
  return merged([
    head,
    neck,
    cap,
    back,
    eye(-0.038),
    eye(0.038),
    // Viền cổ, thắt lưng, gấu váy: sọc đỏ và kem kiểu thổ cẩm.
    band(1.385, 0.13, 0.03, TRIM),
    band(0.86, 0.178, 0.05, TRIM),
    band(0.81, 0.18, 0.018, CREAM),
    band(0.49, 0.207, 0.05, TRIM),
    band(0.44, 0.209, 0.025, CREAM),
  ]);
}

/** Áo và váy/khố: màu trắng để nhân với màu của từng khách. */
export function clothGeometry(): THREE.BufferGeometry {
  const torso = tube(0.215, 0.175, 0.84, 1.4).scale(1, 1, FLAT);
  // Vai tròn.
  const shoulders = at(new THREE.SphereGeometry(0.215, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.32).scale(1, 0.55, FLAT), 0, 1.36, 0);
  const skirt = tube(0.18, 0.208, 0.43, 0.86).scale(1, 1, FLAT);
  return paint(merged([torso, shoulders, skirt]), '#ffffff');
}

/** Một tay, gốc ở vai, buông xuống theo -Y: cánh tay trần và bàn tay. */
export function armGeometry(): THREE.BufferGeometry {
  return merged([
    paint(tube(0.05, 0.042, -0.56, 0, 10), SKIN),
    paint(at(new THREE.SphereGeometry(0.048, 10, 8).scale(0.8, 1.15, 0.9), 0, -0.6, 0), SKIN),
  ]);
}

/** Một chân, gốc ở hông: bắp chân trần và bàn chân (mũi chân hướng -Z). */
export function legGeometry(): THREE.BufferGeometry {
  return merged([
    paint(tube(0.068, 0.05, -0.76, 0, 10), SKIN),
    paint(at(new THREE.BoxGeometry(0.085, 0.055, 0.2), 0, -0.79, -0.04), FOOT),
  ]);
}
