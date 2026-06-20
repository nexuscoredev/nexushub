import { supabase } from './supabase';
import { uploadPersonalMediaBlob } from './personalMediaStorage';

export const DRINK_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
const DRINK_IMAGE_MAX_PX = 1024;
const BANNER_IMAGE_MAX_PX = 1536;
const DRINK_IMAGE_DATA_MAX_CHARS = 900_000;
const DRINK_IMAGE_MAX_MB = DRINK_IMAGE_MAX_BYTES / (1024 * 1024);

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

export type DrinkImageUploadTarget = {
  userId: string;
  kind: 'banner' | 'drink' | 'adega';
  slug?: string;
};

function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Falha ao comprimir imagem.'))),
      'image/jpeg',
      quality,
    );
  });
}

async function resizeImageFile(
  file: File,
  maxPx: number,
): Promise<{ blob: Blob; dataUrl: string }> {
  const dataUrl = await readFileAsDataUrl(file);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      void (async () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height, 1));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível.'));
          return;
        }
        ctx.fillStyle = '#08080a';
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        let quality = 0.88;
        let blob = await canvasToJpegBlob(canvas, quality);
        let out = canvas.toDataURL('image/jpeg', quality);
        if (out.length > DRINK_IMAGE_DATA_MAX_CHARS) {
          quality = 0.72;
          blob = await canvasToJpegBlob(canvas, quality);
          out = canvas.toDataURL('image/jpeg', quality);
        }
        if (out.length > DRINK_IMAGE_DATA_MAX_CHARS) {
          reject(new Error('Imagem grande demais após redimensionar. Tente outra foto.'));
          return;
        }
        resolve({ blob, dataUrl: out });
      })().catch(reject);
    };
    img.onerror = () => reject(new Error('Imagem inválida.'));
    img.src = dataUrl;
  });
}

export function isAllowedDrinkImageFile(file: File): boolean {
  const ext = fileExtension(file.name);
  if (IMAGE_EXTENSIONS.has(ext)) return true;
  return !!file.type && IMAGE_MIME.has(file.type);
}

export function parseDrinkImageUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith('data:image/')) return trimmed;
  try {
    const url = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href;
  } catch {
    return null;
  }
}

export async function fileToDrinkImageUrl(
  file: File,
  upload?: DrinkImageUploadTarget,
): Promise<string> {
  if (!isAllowedDrinkImageFile(file)) {
    throw new Error('Formato não suportado. Use .jpg, .png ou .webp.');
  }
  if (file.size > DRINK_IMAGE_MAX_BYTES) {
    throw new Error(`Arquivo grande demais (máx. ${DRINK_IMAGE_MAX_MB} MB).`);
  }

  const maxPx = upload?.kind === 'banner' ? BANNER_IMAGE_MAX_PX : DRINK_IMAGE_MAX_PX;
  const { blob, dataUrl } = await resizeImageFile(file, maxPx);

  if (upload?.userId && supabase) {
    const path =
      upload.kind === 'banner'
        ? 'drinks-carta/banner.jpg'
        : upload.kind === 'adega'
          ? `adega/${upload.slug ?? 'item'}.jpg`
          : `drinks-carta/${upload.slug ?? 'drink'}.jpg`;
    return uploadPersonalMediaBlob(upload.userId, path, blob, 'image/jpeg');
  }

  return dataUrl;
}

export function drinkImageSourceLabel(src: string): string | null {
  if (src.startsWith('data:image/')) return 'Foto local';
  if (src.includes('hub-personal-media')) return 'Foto na nuvem';
  return null;
}
