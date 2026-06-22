import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyHubUser } from '../../hubAuth.js';

const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 12_000;

function isAllowedImageUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyHubUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const imageUrl = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  const parsed = isAllowedImageUrl(imageUrl);
  if (!parsed) {
    return res.status(400).json({ error: 'URL de imagem inválida.' });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const upstream = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NEXUSHub/1.0 (adega image import)',
        Accept: 'image/*',
      },
      redirect: 'follow',
    });

    if (!upstream.ok) {
      return res.status(502).json({ error: 'Não foi possível baixar esta imagem.' });
    }

    const mime = upstream.headers.get('content-type')?.split(';')[0]?.trim() ?? 'image/jpeg';
    if (!mime.startsWith('image/')) {
      return res.status(400).json({ error: 'O link não é uma imagem.' });
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (buffer.byteLength > MAX_BYTES) {
      return res.status(400).json({ error: 'Imagem grande demais (máx. 10 MB).' });
    }

    return res.status(200).json({
      mime,
      base64: buffer.toString('base64'),
      byteLength: buffer.byteLength,
    });
  } catch {
    return res.status(502).json({ error: 'Falha ao importar imagem.' });
  } finally {
    clearTimeout(timer);
  }
}
