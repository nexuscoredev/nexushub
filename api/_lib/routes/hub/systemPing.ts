import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyHubUser } from '../../hubAuth.js';

function isAllowedUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url;
  } catch {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyHubUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const rawUrl = typeof req.query.url === 'string' ? req.query.url.trim() : '';
  const target = isAllowedUrl(rawUrl);
  if (!target) {
    return res.status(400).json({ error: 'URL inválida' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    let response = await fetch(target.toString(), {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
    });

    if (response.status === 405 || response.status === 501) {
      response = await fetch(target.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });
    }

    const reachable = response.ok || (response.status >= 300 && response.status < 500);
    return res.status(200).json({
      reachable,
      status: response.status,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha na requisição';
    return res.status(200).json({
      reachable: false,
      error: message,
    });
  } finally {
    clearTimeout(timeout);
  }
}
