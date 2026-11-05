import * as THREE from 'three';
import { DOOR_HALF_WIDTH, HALF_WIDTH, HALL_LENGTH, HOUSE_LENGTH, ROOM_LENGTH, WALL_HEIGHT } from './layout';
import { ROOM_COUNT } from '../content/schema';
import type { HitData } from '../nav/picker';
import { sharedTexturedLambert, texturedLambert } from './textures';

const RIDGE_HEIGHT = 7.5;
const EAVE = 0.8;
const DOOR_HEIGHT = 2.4;

export interface House {
  /** Vật cản tia chạm (vách) để không chạm xuyên tường. */
  blockers: THREE.Object3D[];
  door: THREE.Object3D;
}

export function buildHouse(scene: THREE.Scene): House {
  const blockers: THREE.Object3D[] = [];
  // Mỗi vật liệu có màu trơn dự phòng, hiện trong lúc ảnh chưa về hoặc khi ảnh lỗi.
  const woven = sharedTexturedLambert('/media/textures/woven.jpg', '#b8895a');
  const stone = sharedTexturedLambert('/media/textures/stone.jpg', '#555555');
  const wood = texturedLambert('/media/textures/wood.jpg', 1, 1, '#7a5230');

  scene.add(new THREE.HemisphereLight('#fff4e0', '#5a4632', 1.7));
  const sun = new THREE.DirectionalLight('#ffffff', 1.1);
  sun.position.set(-20, 30, 15);
  scene.add(sun);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), texturedLambert('/media/textures/ground.jpg', 60, 60, '#b9b6ae'));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.01;
  scene.add(ground);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(HOUSE_LENGTH, HALF_WIDTH * 2),
    texturedLambert('/media/textures/floor.jpg', HOUSE_LENGTH / 3, 3, '#8a6040'),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(HOUSE_LENGTH / 2, 0.005, 0);
  scene.add(floor);

  const wall = (width: number, height: number, mat: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.15), mat);

  // Hai vách dọc + chân đá bên ngoài
  for (const side of [-1, 1]) {
    const long = wall(HOUSE_LENGTH, WALL_HEIGHT, woven(HOUSE_LENGTH / 2, WALL_HEIGHT / 2));
    long.position.set(HOUSE_LENGTH / 2, WALL_HEIGHT / 2, side * HALF_WIDTH);
    scene.add(long);
    blockers.push(long);
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(HOUSE_LENGTH + 0.4, 0.45, 0.3),
      stone(HOUSE_LENGTH / 2, 0.5),
    );
    plinth.position.set(HOUSE_LENGTH / 2, 0.22, side * (HALF_WIDTH + 0.2));
    scene.add(plinth);
  }

  // Vách hồi cuối nhà
  const back = wall(HALF_WIDTH * 2, WALL_HEIGHT, woven(5, WALL_HEIGHT / 2));
  back.rotation.y = Math.PI / 2;
  back.position.set(HOUSE_LENGTH, WALL_HEIGHT / 2, 0);
  scene.add(back);
  blockers.push(back);

  // Vách hồi đầu nhà có khoảng trống làm cửa
  const sideWidth = HALF_WIDTH - DOOR_HALF_WIDTH;
  for (const side of [-1, 1]) {
    const part = wall(sideWidth, WALL_HEIGHT, woven(sideWidth / 2, WALL_HEIGHT / 2));
    part.rotation.y = Math.PI / 2;
    part.position.set(0, WALL_HEIGHT / 2, side * (DOOR_HALF_WIDTH + sideWidth / 2));
    scene.add(part);
    blockers.push(part);
  }
  const lintel = wall(DOOR_HALF_WIDTH * 2, WALL_HEIGHT - DOOR_HEIGHT, wood);
  lintel.rotation.y = Math.PI / 2;
  lintel.position.set(0, DOOR_HEIGHT + (WALL_HEIGHT - DOOR_HEIGHT) / 2, 0);
  scene.add(lintel);
  blockers.push(lintel);

  // Hai cánh cửa gỗ mở vào trong
  for (const side of [-1, 1]) {
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(1.3, DOOR_HEIGHT, 0.08), wood);
    leaf.position.set(0.7, DOOR_HEIGHT / 2, side * (DOOR_HALF_WIDTH - 0.06));
    scene.add(leaf);
  }

  // Vùng chạm vô hình ở khung cửa
  const door = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, DOOR_HEIGHT, DOOR_HALF_WIDTH * 2),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
  );
  door.position.set(0, DOOR_HEIGHT / 2, 0);
  door.visible = false; // Raycaster vẫn bắt trúng vật ẩn.
  door.userData.hit = { kind: 'door' } satisfies HitData;
  scene.add(door);

  // Thềm gỗ trước cửa
  const deck = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 4), wood);
  deck.position.set(-1.2, 0.06, 0);
  scene.add(deck);

  // Tam giác hồi trên hai đầu
  const gable = new THREE.Shape();
  gable.moveTo(-(HALF_WIDTH + EAVE), 0);
  gable.lineTo(HALF_WIDTH + EAVE, 0);
  gable.lineTo(0, RIDGE_HEIGHT - WALL_HEIGHT);
  gable.closePath();
  const gableMat = woven(0.5, 0.5, { side: THREE.DoubleSide });
  for (const x of [0, HOUSE_LENGTH]) {
    const tri = new THREE.Mesh(new THREE.ShapeGeometry(gable), gableMat);
    tri.rotation.y = Math.PI / 2;
    tri.position.set(x, WALL_HEIGHT, 0);
    scene.add(tri);
  }

  // Mái tranh hai dốc
  const run = HALF_WIDTH + EAVE;
  const rise = RIDGE_HEIGHT - WALL_HEIGHT;
  const slope = Math.hypot(run, rise);
  const roofLength = HOUSE_LENGTH + EAVE * 2;
  const thatch = texturedLambert('/media/textures/thatch.jpg', roofLength / 2, slope / 2, '#8c6f68', { side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const roof = new THREE.Mesh(new THREE.PlaneGeometry(roofLength, slope), thatch);
    roof.rotation.x = -side * Math.atan2(run, rise);
    roof.position.set(HOUSE_LENGTH / 2, WALL_HEIGHT + rise / 2, (side * run) / 2);
    scene.add(roof);
  }

  // Cột và xà ở ranh giới các gian
  const pillarGeo = new THREE.CylinderGeometry(0.14, 0.16, WALL_HEIGHT, 12);
  const beamGeo = new THREE.BoxGeometry(0.2, 0.25, HALF_WIDTH * 2);
  for (let i = 0; i < ROOM_COUNT; i++) {
    const x = HALL_LENGTH + i * ROOM_LENGTH;
    for (const side of [-1, 1]) {
      const pillar = new THREE.Mesh(pillarGeo, wood);
      pillar.position.set(x, WALL_HEIGHT / 2, side * (HALF_WIDTH - 0.3));
      scene.add(pillar);
    }
    const beam = new THREE.Mesh(beamGeo, wood);
    beam.position.set(x, WALL_HEIGHT - 0.1, 0);
    scene.add(beam);
  }

  return { blockers, door };
}
