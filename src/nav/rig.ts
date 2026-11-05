import type * as THREE from 'three';
import { EYE_HEIGHT, clampToWalkable } from '../scene/layout';
import { clamp, easeInOut, shortestAngle } from '../util/math';

interface Tween {
  fromX: number;
  fromZ: number;
  fromYaw: number;
  toX: number;
  toZ: number;
  dYaw: number;
  t: number;
  duration: number;
  done?: () => void;
}

export class CameraRig {
  x = 0;
  z = 0;
  yaw = 0;
  pitch = 0;
  inside = false;
  private tween: Tween | null = null;

  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  get moving(): boolean {
    return this.tween !== null;
  }

  teleport(x: number, z: number, yaw: number): void {
    this.tween = null;
    this.x = x;
    this.z = z;
    this.yaw = yaw;
    this.pitch = 0;
    this.inside = x >= 0;
  }

  moveTo(x: number, z: number, yaw: number, done?: () => void): void {
    const distance = Math.hypot(x - this.x, z - this.z);
    this.tween = {
      fromX: this.x,
      fromZ: this.z,
      fromYaw: this.yaw,
      toX: x,
      toZ: z,
      dYaw: shortestAngle(this.yaw, yaw),
      t: 0,
      duration: clamp(distance / 6, 0.35, 1.6),
      done,
    };
  }

  look(dYaw: number, dPitch: number): void {
    this.yaw += dYaw;
    this.pitch = clamp(this.pitch + dPitch, -0.9, 0.7);
  }

  /** Đi theo hướng nhìn: `forward`, `strafe` tính bằng mét trong khung hình này. */
  walk(forward: number, strafe: number): void {
    if (this.tween) return;
    const s = Math.sin(this.yaw);
    const c = Math.cos(this.yaw);
    const next = clampToWalkable(this.x - s * forward + c * strafe, this.z - c * forward - s * strafe, this.inside);
    this.x = next.x;
    this.z = next.z;
  }

  update(dt: number): void {
    const tw = this.tween;
    if (!tw) return;
    tw.t = Math.min(1, tw.t + dt / tw.duration);
    const k = easeInOut(tw.t);
    this.x = tw.fromX + (tw.toX - tw.fromX) * k;
    this.z = tw.fromZ + (tw.toZ - tw.fromZ) * k;
    this.yaw = tw.fromYaw + tw.dYaw * k;
    this.inside = this.x >= 0;
    if (tw.t >= 1) {
      this.tween = null;
      tw.done?.();
    }
  }

  apply(): void {
    this.camera.position.set(this.x, EYE_HEIGHT, this.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
}
