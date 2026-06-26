/**
 * Centraliza o drink no quadrado 512×512 (fundo escuro).
 */
import sharp from 'sharp';

export const THUMB_SIZE = 512;
export const THUMB_BG = { r: 8, g: 8, b: 10 };

export async function findContentBounds(input, threshold = 42) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minY = info.height;
  let maxY = 0;
  let minX = info.width;
  let maxX = 0;

  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * info.channels;
      const sum = data[i] + data[i + 1] + data[i + 2];
      if (sum > threshold) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
      }
    }
  }

  if (minY > maxY) return null;

  return {
    left: minX,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

export async function centerDrinkThumb(input, output = input) {
  const meta = await sharp(input).metadata();
  const bounds = await findContentBounds(input);
  if (!bounds) {
    throw new Error('Nenhum conteúdo visível na imagem');
  }

  const pad = Math.round(Math.max(bounds.width, bounds.height) * 0.03);
  const left = Math.max(0, bounds.left - pad);
  const top = Math.max(0, bounds.top - pad);
  const right = Math.min(meta.width, bounds.left + bounds.width + pad);
  const bottom = Math.min(meta.height, bounds.top + bounds.height + pad);

  const crop = await sharp(input)
    .extract({
      left,
      top,
      width: right - left,
      height: bottom - top,
    })
    .resize(THUMB_SIZE, THUMB_SIZE, {
      fit: 'cover',
      position: 'centre',
    })
    .toBuffer();

  const target = output === input ? `${output}.tmp` : output;

  await sharp(crop).jpeg({ quality: 90 }).toFile(target);

  if (output === input) {
    const fs = await import('node:fs');
    fs.renameSync(target, output);
  }

  return output;
}
