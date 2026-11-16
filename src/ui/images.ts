/**
 * Comprime una foto en el propio dispositivo antes de subirla: reduce el tamaño
 * y la convierte a WebP. Así se ahorra espacio y datos (clave en planes gratuitos).
 */
export async function compressImage(file: File, maxSide = 900, quality = 0.7): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('El archivo no es una foto.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const webp = canvas.toDataURL('image/webp', quality);
  // Safari antiguo no genera WebP: usar JPEG como respaldo.
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}
