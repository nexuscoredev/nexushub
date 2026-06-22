import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getTodoistToken,
  todoistDeleteComment,
  todoistGetComment,
  todoistUpdateComment,
} from '../../todoist.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const commentId = req.query.commentId as string | undefined;
  if (!commentId) {
    return res.status(400).json({ error: 'commentId obrigatório' });
  }

  const token = getTodoistToken();
  if (!token) {
    return res.status(503).json({ error: 'TODOIST_API_TOKEN não configurado' });
  }

  try {
    if (req.method === 'GET') {
      const comment = await todoistGetComment(commentId);
      return res.status(200).json({ comment });
    }

    if (req.method === 'DELETE') {
      await todoistDeleteComment(commentId);
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const body = req.body as { content?: string };
      if (!body?.content?.trim()) {
        return res.status(400).json({ error: 'content obrigatório' });
      }
      const comment = await todoistUpdateComment(commentId, body.content.trim());
      return res.status(200).json({ comment });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro ao processar comentário',
    });
  }
}
