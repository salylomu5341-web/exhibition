import * as THREE from 'three';
import type { Room, Site } from '../content/schema';
import { buildExhibit, type BuiltExhibit } from '../exhibits/build';
import { buildMarkers } from '../exhibits/markers';
import { buildSigns } from '../exhibits/signs';
import { renderExhibit } from '../features/registry';
import { SoundPlayer } from '../features/sound';
import { onLangChange, t } from '../i18n/lang';
import { attachKeys, attachPointer } from '../nav/input';
import { pickHit, type HitData } from '../nav/picker';
import { CameraRig } from '../nav/rig';
import { roomPath, type Route } from '../nav/route';
import { buildHouse } from '../scene/house';
import { buildPlants } from '../scene/plants';
import { FACE_FORWARD, roomIndexAt, standpoints, viewpointAt, viewpointFor, yawToward } from '../scene/layout';
import { createStage, type Stage } from '../scene/renderer';
import { LazyImages } from '../scene/textures';
import { fitDistance, WallVideo } from '../scene/wall-video';
import { createIntro } from '../ui/intro';
import { playIntroVideo } from '../ui/intro-video';
import { Panel } from '../ui/panel';
import { createRoomBar } from '../ui/roombar';
import { showToast } from '../ui/toast';
import { createTopBar } from '../ui/topbar';
import { installHooks } from './hooks';
import { mountTextVersion } from './text-version';
import type { Visitors } from './visitors';

const WALK_SPEED = 3;
const DOOR_OUTSIDE_X = -1.6;
const DOOR_INSIDE_X = 1.2;
const LOOK_YAW = 0.004;
const LOOK_PITCH = 0.003;

export function startExhibition(site: Site, rooms: Room[], route: Route, stageEl: HTMLElement, uiEl: HTMLElement, textEl: HTMLElement): void {
  const stage = createStage(stageEl);
  try {
    runExhibition(stage, site, rooms, route, uiEl, textEl);
  } catch (err) {
    // Lỗi sau khi đã tạo renderer: nhả ngữ cảnh WebGL trước khi main.ts chuyển sang bản 2D.
    stage.renderer.setAnimationLoop(null);
    stage.renderer.dispose();
    stage.renderer.forceContextLoss();
    throw err;
  }
}

function runExhibition(stage: Stage, site: Site, rooms: Room[], route: Route, uiEl: HTMLElement, textEl: HTMLElement): void {
  const images = new LazyImages();
  const house = buildHouse(stage.scene);
  buildPlants(stage.scene);
  const signs = buildSigns(stage.scene, site, rooms);
  const markers = buildMarkers(stage.scene);
  const built = new Map<string, BuiltExhibit>();
  for (const room of rooms) {
    for (const ex of room.exhibits) {
      const b = buildExhibit(room, ex, images);
      stage.scene.add(b.object);
      built.set(b.key, b);
    }
  }
  const targets: THREE.Object3D[] = [
    ...house.blockers,
    house.door,
    ...markers.targets,
    ...[...built.values()].flatMap((b) => b.hitTargets),
  ];

  const points = standpoints();
  const rig = new CameraRig(stage.camera);
  const player = new SoundPlayer();
  const topbar = createTopBar(uiEl, site.name, { book: true });
  // Khách ảo: chỉ tải mã Realtime khi đã vào trong nhà dài.
  let visitors: Visitors | null = null;
  let visitorsRequested = false;
  const loadVisitors = () => {
    visitorsRequested = true;
    import('./visitors')
      .then((m) => {
        visitors = m.startVisitors(stage.scene);
        topbar.addAction(visitors.button);
      })
      .catch((err) => console.warn('Không bật được khách ảo', err));
  };
  const panel = new Panel(uiEl);
  const wallVideo = new WallVideo(stage.renderer.domElement.parentElement ?? document.body, uiEl);
  const goFromUi = (i: number) => {
    panel.close();
    player.unlock();
    goToIndex(i);
  };
  const bar = createRoomBar(uiEl, rooms, goFromUi);
  // "Vào nhà dài": phát video giới thiệu (nếu có) rồi mới đi vào sảnh.
  const enter = () => {
    player.unlock();
    if (site.introVideo) playIntroVideo(uiEl, site.introVideo, () => goFromUi(0));
    else goFromUi(0);
  };
  const intro = createIntro(uiEl, site, enter);

  /** Đi tới (x, z); nếu phải qua cửa thì đi qua khung cửa, không xuyên vách. */
  function travel(x: number, z: number, yaw: number, then?: () => void): void {
    intro.hide();
    wallVideo.stop();
    const goingIn = x >= 0;
    if (goingIn === rig.inside) {
      rig.moveTo(x, z, yaw, then);
      return;
    }
    const exitX = rig.inside ? DOOR_INSIDE_X : DOOR_OUTSIDE_X;
    const enterX = rig.inside ? DOOR_OUTSIDE_X : DOOR_INSIDE_X;
    const towardDoor = yawToward({ x: exitX, z: 0 }, { x: enterX, z: 0 });
    rig.moveTo(exitX, 0, towardDoor, () => rig.moveTo(enterX, 0, towardDoor, () => rig.moveTo(x, z, yaw, then)));
  }

  function goToIndex(index: number): void {
    const sp = points.find((p) => p.roomIndex === index);
    if (sp) travel(sp.x, sp.z, FACE_FORWARD);
  }

  function openExhibit(key: string): void {
    if (panel.openKey === key || wallVideo.key === key) return;
    const b = built.get(key);
    if (!b) return;
    if (b.exhibit.type === 'video' && b.screen) {
      panel.close();
      wallVideo.play(key, b.exhibit, b.screen);
      return;
    }
    wallVideo.stop();
    panel.open(key, () => t(b.exhibit.title), renderExhibit(b.exhibit, { player, onGong: (i) => b.swing(i) }));
  }

  function focusExhibit(key: string, instant: boolean): void {
    const b = built.get(key);
    // Bấm lại video đang phát: giữ nguyên, không phát lại từ đầu.
    if (!b || wallVideo.key === key) return;
    // Video: đứng gần hơn để màn chiếm phần lớn khung nhìn.
    const vp = b.screen ? viewpointAt(b.anchor, fitDistance(stage.camera.fov, stage.camera.aspect, b.screen.width, b.screen.height)) : viewpointFor(b.anchor);
    const yaw = yawToward(vp, b.anchor);
    if (instant) {
      intro.hide();
      rig.teleport(vp.x, vp.z, yaw);
    } else {
      travel(vp.x, vp.z, yaw);
    }
    openExhibit(key);
  }

  function handleHit(hit: HitData | null): void {
    if (!hit) return;
    switch (hit.kind) {
      case 'door':
        goToIndex(rig.inside ? -1 : 0);
        break;
      case 'standpoint':
        travel(hit.x, hit.z, rig.yaw);
        break;
      case 'exhibit':
        focusExhibit(hit.exhibitKey, false);
        break;
      case 'gong': {
        const b = built.get(hit.exhibitKey);
        if (!b || b.exhibit.type !== 'gongs') return;
        const gong = b.exhibit.gongs[hit.index];
        b.swing(hit.index);
        showToast(t(gong.name));
        void player.play(gong.sound);
        break;
      }
    }
  }

  const canvas = stage.renderer.domElement;
  attachPointer(canvas, {
    onTap: (x, y) => {
      player.unlock();
      handleHit(pickHit(stage.camera, targets, canvas, x, y));
    },
    onLook: (dx, dy) => rig.look(dx * LOOK_YAW, dy * LOOK_PITCH),
  });
  const keys = attachKeys();

  let currentIndex = Number.NaN;
  function onRoomChange(index: number): void {
    currentIndex = index;
    bar.setCurrent(index);
    images.ensure([index - 1, index, index + 1]);
    built.forEach((b) => b.setActive(b.room.order === index));
    const room = index >= 1 ? rooms[index - 1] : null;
    room?.exhibits.forEach((ex) => {
      if (ex.type === 'gongs') player.preload(ex.gongs.map((g) => g.sound));
    });
    const path = room ? roomPath(room.slug) : '/';
    if (location.pathname !== path) history.replaceState(null, '', path);
    document.title = room ? room.seo.title : site.seo.title;
  }

  onLangChange(() => {
    signs.relang();
    built.forEach((b) => b.relang());
    topbar.relang();
    visitors?.relang();
    bar.relang();
    intro.relang();
    panel.relang();
    wallVideo.relang();
  });

  // Vị trí ban đầu: link hiện vật → đứng trước hiện vật; link gian → đầu gian; còn lại → sân trước.
  const startRoom = route.slug ? rooms.find((r) => r.slug === route.slug) : undefined;
  const deepKey = startRoom && route.exhibitId ? `${startRoom.slug}/${route.exhibitId}` : null;
  if (deepKey && built.has(deepKey)) {
    focusExhibit(deepKey, true);
  } else if (startRoom) {
    intro.hide();
    const sp = points.find((p) => p.roomIndex === startRoom.order);
    if (sp) rig.teleport(sp.x, sp.z, FACE_FORWARD);
  } else {
    rig.teleport(points[0].x, points[0].z, FACE_FORWARD);
  }

  const clock = new THREE.Clock();
  stage.renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    const time = clock.elapsedTime;
    const axis = keys.axis();
    const walking = Boolean(axis.forward || axis.strafe);
    if (walking) {
      intro.hide();
      wallVideo.stop();
      rig.walk(axis.forward * WALK_SPEED * dt, axis.strafe * WALK_SPEED * dt);
    }
    rig.update(dt);
    rig.apply();
    const index = roomIndexAt(rig.x);
    if (index !== currentIndex) onRoomChange(index);
    built.forEach((b) => b.update(dt, time));
    markers.update(time, rig.x, rig.z);
    if (!visitorsRequested && rig.inside) loadVisitors();
    visitors?.update({ x: rig.x, z: rig.z, yaw: rig.yaw }, rig.moving || walking, dt);
    stage.renderer.render(stage.scene, stage.camera);
    wallVideo.render(stage.camera);
  });

  // Bản chữ vẫn nằm trong cây truy cập; vẽ cho gian của đường dẫn ban đầu (hoặc trang chủ).
  mountTextVersion(
    textEl,
    site,
    rooms,
    startRoom,
    (key) => {
      player.unlock();
      focusExhibit(key, false);
    },
    // Dựng lại bản chữ thì nút cũ bị thay mất: cho khung trả tiêu điểm về nút mới.
    () => {
      if (panel.openKey) panel.setReturnFocus(textEl.querySelector<HTMLElement>(`[data-open="${CSS.escape(panel.openKey)}"]`));
    },
  );

  installHooks({ mode: '3d', getVisitors: () => visitors, getRoomIndex: () => currentIndex, getOpenKey: () => panel.openKey ?? wallVideo.key, goTo: goToIndex, open: openExhibit });
  document.body.classList.add('mode-3d');
}
