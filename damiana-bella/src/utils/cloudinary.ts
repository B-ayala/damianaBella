/**
 * Injects Cloudinary transformation parameters into a Cloudinary URL.
 * Works only on res.cloudinary.com URLs — passes through all others unchanged.
 *
 * @param url     - Original Cloudinary URL
 * @param options - Transformation options
 */
export function buildCloudinaryUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: 'auto' | number;
    format?: 'auto' | 'webp' | 'avif';
    crop?: 'fill' | 'fit' | 'limit';
  } = {}
): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;

  const { width, height, quality = 'auto', format = 'auto', crop = 'fill' } = options;

  const transforms: string[] = [];
  if (width) transforms.push(`w_${width}`);
  if (height) transforms.push(`h_${height}`);
  transforms.push(`c_${crop}`);
  transforms.push(`f_${format}`);
  transforms.push(`q_${quality}`);

  const transformString = transforms.join(',');

  // Insert after /upload/ in the URL
  return url.replace('/upload/', `/upload/${transformString}/`);
}
