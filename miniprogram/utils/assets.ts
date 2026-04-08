import { getBaseUrl } from '../config/index';

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  if (/^(https?:)?\/\//.test(url) || url.startsWith('data:')) {
    return url;
  }

  const baseUrl = getBaseUrl().replace(/\/$/, '');
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${baseUrl}${normalizedPath}`;
}

export default resolveAssetUrl;
