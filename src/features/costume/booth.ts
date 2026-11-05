import type { ExhibitOf } from '../../content/schema';
import { t } from '../../i18n/lang';
import { UI } from '../../i18n/ui-strings';
import { h } from '../../ui/dom';
import type { PanelContent } from '../../ui/panel';
import { MAX_SCALE, MIN_SCALE, clampFit, coverRect, defaultFit, fitRect, type Fit } from './geometry';

const OUT_W = 1080;
const OUT_H = 1440;
const FRAME_BAR = 120;
const FILE_NAME = 'trien-lam-mnong.jpg';

type Mode = 'idle' | 'camera' | 'upload' | 'result';

export function renderCostume(ex: ExhibitOf<'costume'>): PanelContent {
  let costumeIndex = 0;
  let mode: Mode = 'idle';
  let facing: 'user' | 'environment' = 'user';
  let stream: MediaStream | null = null;
  let uploaded: HTMLImageElement | null = null;
  let uploadUrl: string | null = null;
  let resultUrl: string | null = null;
  let lastBlob: Blob | null = null;
  let messageKey: 'boothNoCamera' | 'mediaError' | null = null;
  let disposed = false;
  let req = 0;
  let fit: Fit = defaultFit(OUT_W, OUT_H);

  const relabels: Array<() => void> = [];
  const button = (label: () => string, cls: string, onClick: () => void) => {
    const b = h('button', { type: 'button', class: cls });
    b.addEventListener('click', onClick);
    const set = () => {
      b.textContent = label();
    };
    set();
    relabels.push(set);
    return b;
  };

  const choices = h('div', { class: 'booth-choices', role: 'group' });
  const video = h('video', { playsinline: '', muted: '', autoplay: '' });
  video.muted = true;
  const preview = h('canvas', { width: String(OUT_W), height: String(OUT_H) });
  const overlay = h('img', { class: 'booth-overlay', alt: '' });
  // Trang phục và vòng đặt mặt dịch, phóng cùng nhau; khách kéo lớp này cho khớp người.
  const fitLayer = h('div', { class: 'booth-fit' }, overlay, h('div', { class: 'booth-guide' }));
  const stageBox = h('div', { class: 'booth-stage' }, video, preview, fitLayer);
  const fitHint = h('p', { class: 'note booth-hint' });
  const message = h('p', { class: 'note', role: 'status' });
  const fileInput = h('input', { type: 'file', accept: 'image/*', hidden: '' });
  const sizeInput = h('input', { type: 'range', min: String(MIN_SCALE), max: String(MAX_SCALE), step: '0.01', value: '1' });
  const sizeText = h('span', {});
  const result = h('div', { class: 'booth-result' });
  const privacy = h('p', { class: 'note' });
  const helpTitle = h('summary', {});
  const helpSteps = h('ol', {});
  const help = h('details', { class: 'booth-help', open: '' }, helpTitle, helpSteps);

  const cameraBtn = button(() => t(UI.boothCamera), 'btn', () => void startCamera());
  const switchBtn = button(() => t(UI.boothSwitch), 'btn secondary', () => {
    facing = facing === 'user' ? 'environment' : 'user';
    void startCamera();
  });
  const shootBtn = button(() => t(UI.boothShoot), 'btn', () => void capture());
  const uploadBtn = button(() => t(UI.boothUpload), 'btn secondary', () => fileInput.click());
  const retakeBtn = button(() => t(UI.boothRetake), 'btn secondary', () => setMode(stream ? 'camera' : uploaded ? 'upload' : 'idle'));
  const actions = h('div', { class: 'booth-actions' }, cameraBtn, switchBtn, shootBtn, uploadBtn);
  const resetBtn = button(() => t(UI.boothReset), 'btn secondary', () => applyFit(defaultFit(OUT_W, OUT_H)));
  const sizeRow = h('div', { class: 'booth-size' }, h('label', {}, sizeText, sizeInput), resetBtn);

  function applyFit(next: Fit): void {
    fit = clampFit(next, OUT_W, OUT_H);
    const home = defaultFit(OUT_W, OUT_H);
    fitLayer.style.transform = `translate(${((fit.x - home.x) / OUT_W) * 100}%, ${((fit.y - home.y) / OUT_H) * 100}%) scale(${fit.scale})`;
    sizeInput.value = String(fit.scale);
  }

  function setMode(next: Mode): void {
    mode = next;
    video.hidden = mode !== 'camera';
    preview.hidden = mode !== 'upload';
    stageBox.hidden = mode === 'result';
    actions.hidden = mode === 'result';
    result.hidden = mode !== 'result';
    switchBtn.hidden = mode !== 'camera';
    shootBtn.hidden = mode !== 'camera' && mode !== 'upload';
    cameraBtn.hidden = mode === 'camera';
    sizeRow.hidden = mode === 'result';
    fitHint.hidden = mode === 'result';
  }

  function setMessage(key: typeof messageKey): void {
    messageKey = key;
    message.textContent = key ? t(UI[key]) : '';
  }

  function renderChoices(): void {
    choices.setAttribute('aria-label', t(ex.title));
    choices.replaceChildren(
      ...ex.costumes.map((c, i) => {
        const b = h('button', { type: 'button', 'aria-pressed': String(i === costumeIndex), title: t(c.name) }, h('img', { src: c.thumb, alt: t(c.name) }));
        b.addEventListener('click', () => {
          costumeIndex = i;
          overlay.src = c.overlay;
          Array.from(choices.children).forEach((child, j) => child.setAttribute('aria-pressed', String(j === i)));
        });
        return b;
      }),
    );
  }

  function stopStream(): void {
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.srcObject = null;
  }

  async function startCamera(): Promise<void> {
    const id = ++req;
    stopStream();
    if (!navigator.mediaDevices?.getUserMedia) {
      showNoCamera();
      return;
    }
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      });
      if (disposed || id !== req) {
        s.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = s;
      video.srcObject = stream;
      video.classList.toggle('mirror', facing === 'user');
      await video.play().catch(() => undefined);
      setMessage(null);
      setMode('camera');
    } catch {
      if (disposed || id !== req) return;
      showNoCamera();
    }
  }

  function showNoCamera(): void {
    setMessage('boothNoCamera');
    setMode(uploaded ? 'upload' : 'idle');
    uploadBtn.classList.add('pulse');
  }

  function drawPreview(): void {
    const ctx = preview.getContext('2d');
    if (!ctx || !uploaded) return;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    const r = coverRect(uploaded.naturalWidth, uploaded.naturalHeight, OUT_W, OUT_H);
    ctx.drawImage(uploaded, r.sx, r.sy, r.sw, r.sh, 0, 0, OUT_W, OUT_H);
  }

  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    req++; // huỷ lần mở camera đang chờ
    stopStream();
    if (uploadUrl) URL.revokeObjectURL(uploadUrl);
    uploadUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      uploaded = img;
      setMessage(null);
      setMode('upload');
      drawPreview();
    };
    img.onerror = () => setMessage('mediaError');
    img.src = uploadUrl;
  });

  sizeInput.addEventListener('input', () => applyFit({ ...fit, scale: Number(sizeInput.value) }));

  // Một ngón (hoặc chuột): kéo trang phục. Hai ngón: dịch theo trung điểm, chụm/mở để đổi cỡ.
  const pointers = new Map<number, { x: number; y: number }>();
  const toOut = () => OUT_W / (stageBox.clientWidth || OUT_W);
  stageBox.addEventListener('pointerdown', (e) => {
    stageBox.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  });
  stageBox.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const before = [...pointers.values()].slice(0, 2);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const after = [...pointers.values()].slice(0, 2);
    const k = toOut();
    if (after.length === 1) {
      applyFit({ ...fit, x: fit.x + (e.clientX - prev.x) * k, y: fit.y + (e.clientY - prev.y) * k });
      return;
    }
    const mid = (p: typeof after) => ({ x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2 });
    const dist = (p: typeof after) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
    const m0 = mid(before);
    const m1 = mid(after);
    const d0 = dist(before);
    applyFit({
      x: fit.x + (m1.x - m0.x) * k,
      y: fit.y + (m1.y - m0.y) * k,
      scale: d0 > 1 ? fit.scale * (dist(after) / d0) : fit.scale,
    });
  });
  const release = (e: PointerEvent) => {
    pointers.delete(e.pointerId);
  };
  stageBox.addEventListener('pointerup', release);
  stageBox.addEventListener('pointercancel', release);
  stageBox.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      applyFit({ ...fit, scale: fit.scale * Math.exp(-e.deltaY * 0.0015) });
    },
    { passive: false },
  );

  function drawFrame(ctx: CanvasRenderingContext2D): void {
    ctx.strokeStyle = '#c79a63';
    ctx.lineWidth = 24;
    ctx.strokeRect(12, 12, OUT_W - 24, OUT_H - 24);
    ctx.fillStyle = '#3b2a1a';
    ctx.fillRect(0, OUT_H - FRAME_BAR, OUT_W, FRAME_BAR);
    ctx.fillStyle = '#f3e6cc';
    ctx.font = '600 44px "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t(UI.boothFrame), OUT_W / 2, OUT_H - FRAME_BAR / 2);
  }

  async function capture(): Promise<void> {
    const out = document.createElement('canvas');
    out.width = OUT_W;
    out.height = OUT_H;
    const ctx = out.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    if (mode === 'camera' && video.videoWidth) {
      const r = coverRect(video.videoWidth, video.videoHeight, OUT_W, OUT_H);
      ctx.save();
      if (facing === 'user') {
        ctx.translate(OUT_W, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(video, r.sx, r.sy, r.sw, r.sh, 0, 0, OUT_W, OUT_H);
      ctx.restore();
    } else if (mode === 'upload' && uploaded) {
      ctx.drawImage(preview, 0, 0);
    } else {
      return;
    }
    if (overlay.complete && overlay.naturalWidth) {
      const r = fitRect(fit, OUT_W, OUT_H);
      ctx.drawImage(overlay, r.dx, r.dy, r.dw, r.dh);
    }
    drawFrame(ctx);
    const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/jpeg', 0.9));
    if (!blob || disposed) return;
    lastBlob = blob;
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(blob);
    renderResult();
    setMode('result');
  }

  function renderResult(): void {
    if (!lastBlob || !resultUrl) return;
    const blob = lastBlob;
    const row = h('div', { class: 'booth-actions' }, h('a', { class: 'btn', href: resultUrl, download: FILE_NAME }, t(UI.boothDownload)), retakeBtn);
    const file = new File([blob], FILE_NAME, { type: 'image/jpeg' });
    if (navigator.canShare?.({ files: [file] })) {
      const share = h('button', { type: 'button', class: 'btn secondary' }, t(UI.boothShare));
      share.addEventListener('click', () => {
        navigator.share({ files: [file], title: t(UI.boothFrame) }).catch(() => undefined);
      });
      row.append(share);
    }
    result.replaceChildren(h('img', { src: resultUrl, alt: t(UI.boothFrame) }), row);
  }

  const update = () => {
    relabels.forEach((fn) => fn());
    sizeText.textContent = t(UI.boothSize);
    fitHint.textContent = t(UI.boothFitHint);
    privacy.textContent = t(UI.boothPrivacy);
    helpTitle.textContent = t(UI.boothHelpTitle);
    helpSteps.replaceChildren(...t(UI.boothHelp).split('\n').map((step) => h('li', {}, step)));
    setMessage(messageKey);
    renderChoices();
    if (mode === 'result') renderResult();
  };

  overlay.src = ex.costumes[0].overlay;
  setMode('idle');
  update();

  return {
    el: h('div', { class: 'p-booth' }, help, choices, stageBox, fitHint, sizeRow, message, actions, fileInput, result, privacy),
    update,
    dispose: () => {
      disposed = true;
      req++;
      stopStream();
      if (uploadUrl) URL.revokeObjectURL(uploadUrl);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    },
  };
}
