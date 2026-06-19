const DRINK_IMAGE_MAX_BYTES = 2 * 1024 * 1024;
const DRINK_IMAGE_MAX_PX = 512;
const DRINK_IMAGE_DATA_MAX_CHARS = 420_000;

const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'webp', 'gif']);
const IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

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

function resizeImageDataUrl(dataUrl: string, maxPx: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
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
      let out = canvas.toDataURL('image/jpeg', 0.86);
      if (out.length > DRINK_IMAGE_DATA_MAX_CHARS) {
        out = canvas.toDataURL('image/jpeg', 0.72);
      }
      resolve(out);
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

export async function fileToDrinkImageUrl(file: File): Promise<string> {
  if (!isAllowedDrinkImageFile(file)) {
    throw new Error('Formato não suportado. Use .jpg, .png ou .webp.');
  }
  if (file.size > DRINK_IMAGE_MAX_BYTES) {
    throw new Error('Arquivo grande demais (máx. 2 MB).');
  }

  const dataUrl = await readFileAsDataUrl(file);
  const resized = await resizeImageDataUrl(dataUrl, DRINK_IMAGE_MAX_PX);
  if (resized.length > DRINK_IMAGE_DATA_MAX_CHARS) {
    throw new Error('Imagem grande demais após redimensionar. Tente outra foto.');
  }
  return resized;
}

export function drinkImageSourceLabel(src: string): string | null {
  if (!src.startsWith('data:image/')) return null;
  return 'Foto local';
}
