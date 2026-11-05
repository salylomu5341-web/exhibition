import type { Lang } from '../content/schema';

export interface Route {
  slug: string | null;
  exhibitId: string | null;
  lang: Lang | null;
}

const SAFE_ID = /^[a-z0-9-]+$/;

export function parseRoute(pathname: string, search: string): Route {
  const match = pathname.match(/^\/phong\/([a-z0-9-]+)\/?$/);
  const params = new URLSearchParams(search);
  const v = params.get('v');
  const lang = params.get('lang');
  return {
    slug: match ? match[1] : null,
    exhibitId: match && v && SAFE_ID.test(v) ? v : null,
    lang: lang === 'vi' || lang === 'mnong' ? lang : null,
  };
}

export function roomPath(slug: string): string {
  return `/phong/${slug}/`;
}

export function exhibitUrl(siteUrl: string, slug: string, exhibitId: string): string {
  return `${siteUrl.replace(/\/$/, '')}${roomPath(slug)}?v=${encodeURIComponent(exhibitId)}`;
}
