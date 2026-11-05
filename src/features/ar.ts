import type { ExhibitOf } from '../content/schema';
import { t } from '../i18n/lang';
import { UI } from '../i18n/ui-strings';
import { h, paragraphs } from '../ui/dom';
import type { PanelContent } from '../ui/panel';

const MODEL_VIEWER_URL = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
let loader: Promise<void> | null = null;

function loadModelViewer(): Promise<void> {
  if (customElements.get('model-viewer')) return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = MODEL_VIEWER_URL;
    script.onload = () => resolve();
    script.onerror = () => {
      loader = null;
      reject(new Error('Không tải được model-viewer'));
    };
    document.head.append(script);
  });
  return loader;
}

type NoteKey = 'arUnsupported' | 'mediaError' | 'viewerError';

export function renderAr(ex: ExhibitOf<'ar'>): PanelContent {
  let noteKey: NoteKey | null = null;
  const note = h('p', { class: 'note', role: 'status' });
  const text = h('div', { class: 'p-text' });
  const viewer = document.createElement('model-viewer');
  const attrs: Record<string, string> = {
    src: ex.glb,
    ar: '',
    'ar-modes': 'webxr scene-viewer quick-look',
    'camera-controls': '',
    'auto-rotate': '',
    'shadow-intensity': '1',
  };
  if (ex.usdz) attrs['ios-src'] = ex.usdz;
  if (ex.poster) attrs.poster = ex.poster;
  for (const [k, v] of Object.entries(attrs)) viewer.setAttribute(k, v);
  const arButton = h('button', { type: 'button', slot: 'ar-button', class: 'btn ar-btn' });
  viewer.append(arButton);

  const setNote = (key: NoteKey | null) => {
    noteKey = key;
    note.textContent = key ? t(UI[key]) : '';
  };
  viewer.addEventListener('load', () => {
    const canAr = (viewer as HTMLElement & { canActivateAR?: boolean }).canActivateAR;
    setNote(canAr ? null : 'arUnsupported');
  });
  viewer.addEventListener('error', () => setNote('mediaError'));
  loadModelViewer().catch(() => setNote('viewerError'));

  const update = () => {
    arButton.textContent = t(UI.viewAr);
    viewer.setAttribute('alt', t(ex.title));
    text.replaceChildren(...paragraphs(t(ex.body)));
    setNote(noteKey);
  };
  update();
  return { el: h('div', { class: 'p-ar' }, viewer, note, text), update, dispose: () => viewer.remove() };
}
