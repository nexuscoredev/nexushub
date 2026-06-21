import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyHubUser } from '../_lib/hubAuth.js';
import { searchAdegaImages } from '../_lib/adegaImageSearch.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await verifyHubUser(req.headers.authorization);
  if (!user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }

  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    return res.status(400).json({ error: 'Informe pelo menos 2 caracteres.' });
  }
  if (q.length > 80) {
    return res.status(400).json({ error: 'Busca longa demais.' });
  }

  try {
    const results = await searchAdegaImages(q, 10);
    const googleConfigured = Boolean(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_ID);
    return res.status(200).json({
      results,
      googleConfigured,
      attribution: googleConfigured ? 'Google · Wikimedia Commons' : 'Wikimedia Commons',
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Falha na busca de imagens';
    return res.status(502).json({ error: message });
  }
}
