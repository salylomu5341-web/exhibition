import { describe, expect, it } from 'vitest';
import { clamp, easeInOut, shortestAngle } from '../../src/util/math';
import { bodyText, excerpt, textBlocks, wrapText } from '../../src/util/text';
import { esc } from '../../src/content/escape';

describe('math', () => {
  it('clamp giới hạn trong khoảng', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });
  it('easeInOut đi từ 0 tới 1, đối xứng ở giữa', () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(1)).toBe(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });
  it('shortestAngle chọn đường quay ngắn nhất', () => {
    expect(shortestAngle(0, Math.PI / 2)).toBeCloseTo(Math.PI / 2);
    expect(shortestAngle(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
    expect(shortestAngle(-3, 3)).toBeCloseTo(6 - Math.PI * 2);
  });
});

describe('text', () => {
  const measure = (s: string) => s.length;
  it('wrapText ngắt dòng theo độ rộng', () => {
    expect(wrapText('một hai ba bốn năm', 7, measure)).toEqual(['một hai', 'ba bốn', 'năm']);
  });
  it('wrapText giữ nguyên từ dài hơn độ rộng', () => {
    expect(wrapText('xinchaoban a', 4, measure)).toEqual(['xinchaoban', 'a']);
  });
  it('textBlocks tách đoạn, đoạn bắt đầu bằng "## " là tiêu đề nhỏ', () => {
    expect(textBlocks('## 1. Khái quát\n\nĐoạn một.\n\n\nĐoạn hai.')).toEqual([
      { heading: true, text: '1. Khái quát' },
      { heading: false, text: 'Đoạn một.' },
      { heading: false, text: 'Đoạn hai.' },
    ]);
  });
  it('bodyText bỏ tiêu đề nhỏ, nối các đoạn', () => {
    expect(bodyText('## Khẩu hiệu\n\n## 1. Khái quát\n\nĐoạn một.\n\nĐoạn hai.')).toBe('Đoạn một. Đoạn hai.');
  });
  it('excerpt cắt ở khoảng trắng và thêm dấu …', () => {
    expect(excerpt('Cồng chiêng gắn với đời sống', 15)).toBe('Cồng chiêng gắn…');
    expect(excerpt('ngắn', 15)).toBe('ngắn');
  });
});

describe('esc', () => {
  it('thoát ký tự HTML', () => {
    expect(esc(`<a href="x">M'Nông & co</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;M&#39;Nông &amp; co&lt;/a&gt;');
  });
});
