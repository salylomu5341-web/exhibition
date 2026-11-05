import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function configure(tex: THREE.Texture, repeatX: number, repeatY: number): void {
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
}

/** Gắn ảnh vào vật liệu khi ảnh đã về: đổi màu nền sang trắng để ảnh hiện đúng màu. */
function applyMap(material: THREE.MeshLambertMaterial, tex: THREE.Texture): void {
  material.map = tex;
  material.color.set('#ffffff');
  material.needsUpdate = true;
}

/**
 * Vật liệu hiện màu trơn `fallback` trong lúc ảnh chưa về hoặc khi ảnh lỗi;
 * chỉ gắn `map` khi ảnh đã tải xong nên không có cảnh báo "no image data".
 */
export function texturedLambert(
  url: string,
  repeatX: number,
  repeatY: number,
  fallback: string,
  params: THREE.MeshLambertMaterialParameters = {},
): THREE.MeshLambertMaterial {
  const material = new THREE.MeshLambertMaterial({ ...params, color: fallback });
  loader.load(
    url,
    (tex) => {
      configure(tex, repeatX, repeatY);
      applyMap(material, tex);
    },
    undefined,
    () => console.warn(`Không tải được ảnh ${url}`),
  );
  return material;
}

/** Nạp ảnh một lần; mỗi độ lặp là một bản clone dùng chung Source nên chỉ tải lên GPU một lần. */
export function sharedTexturedLambert(
  url: string,
  fallback: string,
): (repeatX: number, repeatY: number, params?: THREE.MeshLambertMaterialParameters) => THREE.MeshLambertMaterial {
  let base: THREE.Texture | null = null;
  const waiting: Array<() => void> = [];
  loader.load(
    url,
    (tex) => {
      configure(tex, 1, 1);
      base = tex;
      waiting.splice(0).forEach((attach) => attach());
    },
    undefined,
    () => console.warn(`Không tải được ảnh ${url}`),
  );
  return (repeatX, repeatY, params = {}) => {
    const material = new THREE.MeshLambertMaterial({ ...params, color: fallback });
    const attach = () => {
      if (!base) return;
      const tex = base.clone(); // ảnh đã về nên clone() đánh dấu tải lên là hợp lệ
      tex.repeat.set(repeatX, repeatY);
      applyMap(material, tex);
    };
    if (base) attach();
    else waiting.push(attach);
    return material;
  };
}

type ImageMaterial = THREE.MeshBasicMaterial | THREE.MeshStandardMaterial | THREE.MeshLambertMaterial;

/** Ảnh trưng bày chỉ nạp khi khách tới gần gian đó. Lỗi thì giữ màu trơn. */
export class LazyImages {
  private pending = new Map<number, Array<() => void>>();
  private loaded = new Set<number>();

  add(roomIndex: number, url: string, material: ImageMaterial): void {
    const job = () =>
      loader.load(
        url,
        (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          material.map = tex;
          material.color.set('#ffffff');
          material.needsUpdate = true;
        },
        undefined,
        () => console.warn(`Không tải được ảnh ${url}`),
      );
    if (this.loaded.has(roomIndex)) {
      job();
      return;
    }
    const list = this.pending.get(roomIndex) ?? [];
    list.push(job);
    this.pending.set(roomIndex, list);
  }

  ensure(roomIndices: number[]): void {
    for (const index of roomIndices) {
      if (this.loaded.has(index)) continue;
      this.loaded.add(index);
      this.pending.get(index)?.forEach((job) => job());
      this.pending.delete(index);
    }
  }
}
