import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getLang, initLang, onLangChange, pickAudio, setLang, t } from '../../src/i18n/lang';

const storage = (value: string | null) => ({ getItem: () => value });

describe('lang', () => {
  beforeEach(() => {
    initLang(null, storage(null));
  });

  it('mặc định là tiếng Việt', () => {
    expect(getLang()).toBe('vi');
  });

  it('ưu tiên ngôn ngữ trên link, rồi tới lựa chọn đã lưu', () => {
    expect(initLang('mnong', storage('vi'))).toBe('mnong');
    expect(initLang(null, storage('mnong'))).toBe('mnong');
    expect(initLang(null, storage('xyz'))).toBe('vi');
  });

  it('ngôn ngữ trên link được lưu lại để tải lại trang vẫn giữ', () => {
    const setItem = vi.fn();
    initLang('mnong', { getItem: () => null, setItem });
    expect(setItem).toHaveBeenCalledWith('mnong-lang', 'mnong');
    setItem.mockClear();
    initLang(null, { getItem: () => 'vi', setItem });
    expect(setItem).not.toHaveBeenCalled();
  });

  it('không lỗi khi không lưu được ngôn ngữ từ link', () => {
    const broken = { getItem: () => null, setItem: () => { throw new Error('blocked'); } };
    expect(initLang('mnong', broken)).toBe('mnong');
  });

  it('không lỗi khi trình duyệt chặn lưu trữ', () => {
    const broken = { getItem: () => { throw new Error('blocked'); } };
    expect(initLang(null, broken)).toBe('vi');
  });

  it('setLang báo cho người nghe, không báo khi không đổi', () => {
    const fn = vi.fn();
    const off = onLangChange(fn);
    setLang('mnong');
    setLang('mnong');
    off();
    setLang('vi');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('mnong');
  });

  it('t lấy chữ theo ngôn ngữ, rỗng thì dùng tiếng Việt', () => {
    expect(t({ vi: 'Chiêng', mnong: 'Cing' }, 'mnong')).toBe('Cing');
    expect(t({ vi: 'Chiêng', mnong: '' }, 'mnong')).toBe('Chiêng');
  });

  it('pickAudio trả null khi thiếu file', () => {
    expect(pickAudio({ vi: '/media/a.wav' }, 'mnong')).toBeNull();
    expect(pickAudio(undefined, 'vi')).toBeNull();
    expect(pickAudio({ vi: '/media/a.wav' }, 'vi')).toBe('/media/a.wav');
  });
});
