/**
 * Proxies an image through weserv.nl for higher quality, CORS bypass, and consistent rendering.
 * 
 * @param url - Original image URL
 * @param options - width, height, quality, fit
 * @returns Proxied URL with quality parameters
 */
export function hdImage(
  url: string | undefined | null,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    format?: 'webp' | 'jpg' | 'png';
  } = {}
): string {
  if (!url || !url.trim()) return '';
  const src = url.trim();

  // Don't double-proxy
  if (src.includes('images.weserv.nl')) return src;
  // Don't proxy data URIs or local assets
  if (src.startsWith('data:') || src.startsWith('/') || src.startsWith('blob:')) return src;

  const { width, height, quality = 85, fit = 'cover', format = 'webp' } = options;

  const params = new URLSearchParams({
    url: src,
    default: '1',
    q: String(quality),
    output: format,
    fit,
    sharp: '1',
  });

  if (width) params.set('w', String(width));
  if (height) params.set('h', String(height));

  return `https://images.weserv.nl/?${params.toString()}`;
}

/** Poster (portrait 2:3) — cards in grids */
export const posterImage = (url?: string | null) =>
  hdImage(url, { width: 500, height: 750, quality: 90 });

/** Poster small — for row carousels */
export const posterSmall = (url?: string | null) =>
  hdImage(url, { width: 400, height: 600, quality: 85 });

/** Backdrop / banner — wide hero images */
export const backdropImage = (url?: string | null) =>
  hdImage(url, { width: 1280, height: 720, quality: 90 });

/** Hero carousel — large banner */
export const heroImage = (url?: string | null) =>
  hdImage(url, { width: 1920, height: 1080, quality: 90 });

/** Featured card thumbnail */
export const featuredImage = (url?: string | null) =>
  hdImage(url, { width: 640, height: 360, quality: 85 });

/** Episode thumbnail */
export const episodeThumbnail = (url?: string | null) =>
  hdImage(url, { width: 320, height: 180, quality: 80 });

/** Channel icon / square */
export const iconImage = (url?: string | null) =>
  hdImage(url, { width: 200, height: 200, quality: 80, fit: 'contain' });
