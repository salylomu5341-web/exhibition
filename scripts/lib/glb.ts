import { CircleGeometry, CylinderGeometry, SphereGeometry, type BufferGeometry } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Material {
  rgba: [number, number, number, number];
  metallic: number;
  roughness: number;
  /** Dán ảnh (JPEG/PNG) lên mặt; hình phải có toạ độ uv. */
  image?: { data: Buffer; mimeType: 'image/jpeg' | 'image/png' };
}

interface Part {
  geo: BufferGeometry;
  material: Material;
}

/** Ghi nhiều phần hình (mỗi phần một vật liệu) thành một file GLB 2.0. */
export function partsToGlb(parts: Part[]): Buffer {
  const chunks: Buffer[] = [];
  const bufferViews: object[] = [];
  const accessors: object[] = [];
  let offset = 0;
  const view = (buf: Buffer, target?: number): number => {
    const pad = Buffer.alloc((4 - (buf.length % 4)) % 4);
    chunks.push(buf, pad);
    bufferViews.push({ buffer: 0, byteOffset: offset, byteLength: buf.length, ...(target ? { target } : {}) });
    offset += buf.length + pad.length;
    return bufferViews.length - 1;
  };
  const floats = (a: Float32Array) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);

  const images: object[] = [];
  const materials = parts.map(({ material: m }) => {
    const pbr: Record<string, unknown> = { baseColorFactor: m.rgba, metallicFactor: m.metallic, roughnessFactor: m.roughness };
    if (m.image) {
      images.push({ bufferView: view(m.image.data), mimeType: m.image.mimeType });
      pbr.baseColorTexture = { index: images.length - 1 };
    }
    return { pbrMetallicRoughness: pbr };
  });

  const primitives = parts.map(({ geo }, i) => {
    const pos = geo.getAttribute('position').array as Float32Array;
    const nor = geo.getAttribute('normal').array as Float32Array;
    const index = geo.getIndex();
    if (!index) throw new Error('geometry phải có index');
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let j = 0; j < pos.length; j += 3) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], pos[j + k]);
        max[k] = Math.max(max[k], pos[j + k]);
      }
    }
    const attributes: Record<string, number> = {};
    accessors.push({ bufferView: view(floats(pos), 34962), componentType: 5126, count: pos.length / 3, type: 'VEC3', min, max });
    attributes.POSITION = accessors.length - 1;
    accessors.push({ bufferView: view(floats(nor), 34962), componentType: 5126, count: nor.length / 3, type: 'VEC3' });
    attributes.NORMAL = accessors.length - 1;
    if (parts[i].material.image) {
      // glTF đặt gốc uv ở góc trên-trái ảnh, three.js ở góc dưới-trái: lật v.
      const uv = Float32Array.from(geo.getAttribute('uv').array as Float32Array, (v, j) => (j % 2 ? 1 - v : v));
      accessors.push({ bufferView: view(floats(uv), 34962), componentType: 5126, count: uv.length / 2, type: 'VEC2' });
      attributes.TEXCOORD_0 = accessors.length - 1;
    }
    const idx = new Uint32Array(index.array);
    accessors.push({ bufferView: view(Buffer.from(idx.buffer, idx.byteOffset, idx.byteLength), 34963), componentType: 5125, count: idx.length, type: 'SCALAR' });
    return { attributes, indices: accessors.length - 1, material: i };
  });

  const bin = Buffer.concat(chunks);
  const json: Record<string, unknown> = {
    asset: { version: '2.0', generator: 'trien-lam-mnong' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives }],
    materials,
    buffers: [{ byteLength: bin.length }],
    bufferViews,
    accessors,
  };
  if (images.length) {
    json.images = images;
    json.samplers = [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }];
    json.textures = images.map((_, i) => ({ source: i, sampler: 0 }));
  }

  let jsonBuf = Buffer.from(JSON.stringify(json), 'utf8');
  jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc((4 - (jsonBuf.length % 4)) % 4, 0x20)]);
  const total = 12 + 8 + jsonBuf.length + 8 + bin.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // "glTF"
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(total, 8);
  const jsonHeader = Buffer.alloc(8);
  jsonHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"
  const binHeader = Buffer.alloc(8);
  binHeader.writeUInt32LE(bin.length, 0);
  binHeader.writeUInt32LE(0x004e4942, 4); // "BIN"
  return Buffer.concat([header, jsonHeader, jsonBuf, binHeader, bin]);
}

export function geometryToGlb(geo: BufferGeometry, rgba: [number, number, number, number], metallic: number, roughness: number): Buffer {
  return partsToGlb([{ geo, material: { rgba, metallic, roughness } }]);
}

/** Chiêng mẫu: đĩa tròn có núm ở giữa, mặt quay về +z. */
export function gongGlb(): Buffer {
  const disc = new CylinderGeometry(0.4, 0.4, 0.06, 64);
  disc.rotateX(Math.PI / 2);
  const boss = new SphereGeometry(0.09, 32, 16);
  boss.scale(1, 1, 0.6);
  boss.translate(0, 0, 0.04);
  const merged = mergeGeometries([disc, boss]);
  if (!merged) throw new Error('không ghép được hình chiêng');
  return geometryToGlb(merged, [0.78, 0.6, 0.25, 1], 0.9, 0.35);
}

/**
 * Chiêng bằng (không núm) dán ảnh chụp mặt chiêng lên hai mặt, vành màu đồng sẫm.
 * `image`: ảnh vuông, mặt chiêng tròn vừa khít khung.
 */
export function photoGongGlb(image: Buffer, mimeType: 'image/jpeg' | 'image/png'): Buffer {
  const R = 0.4;
  const T = 0.05;
  const front = new CircleGeometry(R, 72).translate(0, 0, T / 2);
  const back = new CircleGeometry(R, 72).rotateY(Math.PI).translate(0, 0, -T / 2);
  const faces = mergeGeometries([front, back]);
  if (!faces) throw new Error('không ghép được mặt chiêng');
  const rim = new CylinderGeometry(R, R, T, 72, 1, true).rotateX(Math.PI / 2);
  rim.deleteAttribute('uv');
  return partsToGlb([
    { geo: faces, material: { rgba: [1, 1, 1, 1], metallic: 0.3, roughness: 0.55, image: { data: image, mimeType } } },
    { geo: rim, material: { rgba: [0.28, 0.22, 0.15, 1], metallic: 0.6, roughness: 0.45 } },
  ]);
}
