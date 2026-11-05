import { PerspectiveCamera } from 'three';
import { describe, expect, it, vi } from 'vitest';
import { axisFromKeys } from '../../src/nav/input';
import { CameraRig } from '../../src/nav/rig';
import { EYE_HEIGHT, FACE_FORWARD } from '../../src/scene/layout';

const run = (rig: CameraRig, seconds: number) => {
  for (let t = 0; t < seconds; t += 0.05) rig.update(0.05);
};

describe('CameraRig', () => {
  it('teleport đặt vị trí và biết đang trong hay ngoài nhà', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(-9, 0, FACE_FORWARD);
    expect(rig.inside).toBe(false);
    rig.teleport(3, 0, FACE_FORWARD);
    expect(rig.inside).toBe(true);
  });

  it('moveTo trượt tới đích, gọi done một lần, cập nhật inside', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(-9, 0, FACE_FORWARD);
    const done = vi.fn();
    rig.moveTo(3, 0, FACE_FORWARD, done);
    expect(rig.moving).toBe(true);
    run(rig, 3);
    expect(rig.x).toBeCloseTo(3);
    expect(rig.inside).toBe(true);
    expect(rig.moving).toBe(false);
    expect(done).toHaveBeenCalledTimes(1);
  });

  it('moveTo cập nhật inside ngay giữa chừng khi băng qua x = 0', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(-3, 0, FACE_FORWARD);
    rig.moveTo(3, 0, FACE_FORWARD);
    expect(rig.inside).toBe(false);
    let crossed = false;
    for (let i = 0; i < 100 && rig.moving; i++) {
      rig.update(0.05);
      expect(rig.inside).toBe(rig.x >= 0);
      if (rig.x >= 0) crossed = true;
    }
    expect(crossed).toBe(true);
  });

  it('walk đi theo hướng nhìn và không ra khỏi vách', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(3, 0, FACE_FORWARD);
    rig.walk(1, 0);
    expect(rig.x).toBeCloseTo(4);
    expect(rig.z).toBeCloseTo(0);
    rig.walk(0, -100);
    expect(rig.z).toBe(-4);
  });

  it('walk bị bỏ qua khi đang trượt', () => {
    const rig = new CameraRig(new PerspectiveCamera());
    rig.teleport(3, 0, FACE_FORWARD);
    rig.moveTo(10, 0, FACE_FORWARD);
    rig.walk(5, 0);
    expect(rig.x).toBe(3);
  });

  it('apply đặt camera ở tầm mắt', () => {
    const camera = new PerspectiveCamera();
    const rig = new CameraRig(camera);
    rig.teleport(3, 1, FACE_FORWARD);
    rig.apply();
    expect(camera.position.toArray()).toEqual([3, EYE_HEIGHT, 1]);
  });
});

describe('axisFromKeys', () => {
  it('W/S tiến lùi, A/D sang ngang, mũi tên tương đương', () => {
    expect(axisFromKeys(new Set(['w']))).toEqual({ forward: 1, strafe: 0 });
    expect(axisFromKeys(new Set(['arrowdown', 'd']))).toEqual({ forward: -1, strafe: 1 });
    expect(axisFromKeys(new Set(['w', 's', 'a']))).toEqual({ forward: 0, strafe: -1 });
  });
});
