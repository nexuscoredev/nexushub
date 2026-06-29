/**
 * Normalização de thumbs de cápsulas de café (crop de compositos + quadrado 512).
 */
import sharp from 'sharp';
import { findContentBounds, THUMB_BG, THUMB_SIZE } from './drink-thumb-center.mjs';

/** Mercafé às vezes entrega PNG quadrado com caixa + cápsula (ex.: Gourmet). */
export const MERCAFE_COMPOSITE_CAPSULES = new Set(['tres-coracoes/espresso-ristretto']);

const MERCAFE_COMPOSITE_CROP = {
  leftFrac: 0,
  topFrac: 0.42,
  widthFrac: 0.38,
  heightFrac: 0.58,
};

/** mobile-hero DG: cápsula pequena no canto inferior esquerdo da arte da caixa. */
const DG_BOX_CAPSULE_CROP = {
  leftFrac: 0,
  topFrac: 0.62,
  widthFrac: 0.25,
  heightFrac: 0.32,
};

/** x_cara-capsula: cápsula no canto inferior direito (xícara à esquerda). */
const DG_XICARA_CAPSULE_CROP = {
  leftFrac: 0.52,
  topFrac: 0.58,
  widthFrac: 0.42,
  heightFrac: 0.38,
};

export const COFFEE_CAPSULE_INNER = Math.round(THUMB_SIZE * 0.8);

export async function extractMercafeCompositeCapsule(input) {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error('dimensões inválidas');

  const region = {
    left: Math.round(w * MERCAFE_COMPOSITE_CROP.leftFrac),
    top: Math.round(h * MERCAFE_COMPOSITE_CROP.topFrac),
    width: Math.max(1, Math.round(w * MERCAFE_COMPOSITE_CROP.widthFrac)),
    height: Math.max(1, Math.round(h * MERCAFE_COMPOSITE_CROP.heightFrac)),
  };

  return sharp(input).extract(region).toBuffer();
}

export async function extractDolceGustoCapsuleFromBox(input, hint = '') {
  const meta = await sharp(input).metadata();
  const w = meta.width ?? 0;
  const h = meta.height ?? 0;
  if (!w || !h) throw new Error('dimensões inválidas');

  const useXicaraLayout = /x_cara-capsula|xicara.e.capsula|xicara_e_capsula/i.test(hint);
  const cropSpec = useXicaraLayout ? DG_XICARA_CAPSULE_CROP : DG_BOX_CAPSULE_CROP;

  const region = {
    left: Math.round(w * cropSpec.leftFrac),
    top: Math.round(h * cropSpec.topFrac),
    width: Math.max(1, Math.round(w * cropSpec.widthFrac)),
    height: Math.max(1, Math.round(h * cropSpec.heightFrac)),
  };

  return sharp(input).extract(region).toBuffer();
}

export async function centerCoffeeCapsule(input, output = input) {
  const prepped = await sharp(input).flatten({ background: THUMB_BG }).toBuffer();
  const meta = await sharp(prepped).metadata();
  let bounds = await findContentBounds(prepped, 55);
  if (!bounds) bounds = await findContentBounds(prepped, 25);
  if (!bounds) throw new Error('Nenhum conteúdo visível na imagem');

  const pad = Math.round(Math.max(bounds.width, bounds.height) * 0.08);
  const left = Math.max(0, bounds.left - pad);
  const top = Math.max(0, bounds.top - pad);
  const right = Math.min(meta.width ?? 0, bounds.left + bounds.width + pad);
  const bottom = Math.min(meta.height ?? 0, bounds.top + bounds.height + pad);

  const crop = await sharp(prepped)
    .extract({
      left,
      top,
      width: right - left,
      height: bottom - top,
    })
    .resize(COFFEE_CAPSULE_INNER, COFFEE_CAPSULE_INNER, {
      fit: 'inside',
      background: THUMB_BG,
    })
    .toBuffer();

  const target = output === input ? `${output}.tmp` : output;

  await sharp({
    create: {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      channels: 3,
      background: THUMB_BG,
    },
  })
    .composite([{ input: crop, gravity: 'centre' }])
    .jpeg({ quality: 90 })
    .toFile(target);

  if (output === input) {
    const fs = await import('node:fs');
    fs.renameSync(target, output);
  }

  return output;
}

export async function normalizeCoffeeCapsuleImage(filePath, catalogKey) {
  let buf = await sharp(filePath).toBuffer();

  if (MERCAFE_COMPOSITE_CAPSULES.has(catalogKey)) {
    buf = await extractMercafeCompositeCapsule(buf);
  }

  const tmp = `${filePath}.prep.jpg`;
  await sharp(buf).jpeg({ quality: 95 }).toFile(tmp);
  try {
    await centerCoffeeCapsule(tmp, filePath);
  } catch {
    await sharp(buf)
      .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', background: THUMB_BG })
      .jpeg({ quality: 90 })
      .toFile(filePath);
  }
  const fs = await import('node:fs');
  fs.unlinkSync(tmp);
  return filePath;
}
