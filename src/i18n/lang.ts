import type { Lang, LText } from '../content/schema';

type Listener = (lang: Lang) => void;

const STORAGE_KEY = 'mnong-lang';
let current: Lang = 'vi';
const listeners = new Set<Listener>();

export function isLang(value: unknown): value is Lang {
  return value === 'vi' || value === 'mnong';
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function initLang(fromUrl: Lang | null, storage: Pick<Storage, 'getItem'> & Partial<Pick<Storage, 'setItem'>> | null = safeStorage()): Lang {
  let saved: string | null = null;
  try {
    saved = storage?.getItem(STORAGE_KEY) ?? null;
  } catch {
    saved = null;
  }
  current = fromUrl ?? (isLang(saved) ? saved : 'vi');
  if (fromUrl) {
    // Đi trong nhà thì địa chỉ mất ?lang=; lưu lại để tải lại trang vẫn giữ ngôn ngữ.
    try {
      storage?.setItem?.(STORAGE_KEY, fromUrl);
    } catch {
      // Trình duyệt chặn lưu trữ: bỏ qua.
    }
  }
  return current;
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    safeStorage()?.setItem(STORAGE_KEY, lang);
  } catch {
    // Trình duyệt chặn lưu trữ: vẫn đổi ngôn ngữ trong phiên này.
  }
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function t(text: LText, lang: Lang = current): string {
  return text[lang] || text.vi;
}

export function pickAudio(audio: { vi?: string; mnong?: string } | undefined, lang: Lang = current): string | null {
  return audio?.[lang] ?? null;
}
