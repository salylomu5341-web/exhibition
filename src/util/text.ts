export interface TextBlock {
  heading: boolean;
  text: string;
}

/** Tách chữ thành các đoạn (cách nhau một dòng trống); đoạn bắt đầu bằng "## " là tiêu đề nhỏ. */
export function textBlocks(text: string): TextBlock[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => (p.startsWith('## ') ? { heading: true, text: p.slice(3).trim() } : { heading: false, text: p }));
}

/** Chỉ phần thân (bỏ tiêu đề nhỏ), nối thành một đoạn: dùng cho bảng tóm tắt trên vách. */
export function bodyText(text: string): string {
  return textBlocks(text)
    .filter((b) => !b.heading)
    .map((b) => b.text)
    .join(' ');
}

export function wrapText(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (!line || measure(test) <= maxWidth) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function excerpt(text: string, max: number): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const endsOnWord = flat[max] === ' ';
  const space = cut.lastIndexOf(' ');
  return `${(!endsOnWord && space > max * 0.6 ? cut.slice(0, space) : cut).trimEnd()}…`;
}
