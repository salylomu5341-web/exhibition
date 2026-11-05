import * as THREE from 'three';

export interface Stage {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    // three r176 chỉ chạy WebGL2.
    const gl = canvas.getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function createStage(container: HTMLElement): Stage {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#bcd6ec');
  scene.fog = new THREE.Fog('#bcd6ec', 45, 130);

  const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 200);

  const resize = () => {
    const w = container.clientWidth || window.innerWidth;
    const h = container.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Màn dọc: giữ góc nhìn ngang tối thiểu 50°.
    const minH = THREE.MathUtils.degToRad(50);
    camera.fov = Math.min(90, Math.max(70, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(minH / 2) / camera.aspect))));
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera };
}
