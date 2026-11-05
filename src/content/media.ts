export function collectMediaPaths(value: unknown, out = new Set<string>()): Set<string> {
  if (typeof value === 'string') {
    if (value.startsWith('/media/')) out.add(value);
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectMediaPaths(item, out));
  } else if (value && typeof value === 'object') {
    Object.values(value).forEach((item) => collectMediaPaths(item, out));
  }
  return out;
}
