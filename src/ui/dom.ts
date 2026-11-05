import { textBlocks } from '../util/text';

type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) el.setAttribute(key, value);
  for (const child of children) if (child !== null && child !== undefined && child !== false) el.append(child);
  return el;
}

export function paragraphs(text: string): HTMLElement[] {
  return textBlocks(text).map((b) => h(b.heading ? 'h3' : 'p', {}, b.text));
}
