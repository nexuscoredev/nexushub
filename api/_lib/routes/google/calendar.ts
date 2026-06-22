import type { VercelRequest, VercelResponse } from '@vercel/node';
import { google } from 'googleapis';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  htmlLink?: string;
  calendar: 'rafael' | 'vinicius' | 'combinado';
}

function parseServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const decoded = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

async function fetchGoogleEvents(
  calendarId: string,
  calendarKey: 'rafael' | 'vinicius',
): Promise<CalendarEvent[]> {
  const credentials = parseServiceAccount();
  if (!credentials) return [];

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
  });
  const calendar = google.calendar({ version: 'v3', auth });
  const now = new Date();
  const in30 = new Date(now);
  in30.setDate(in30.getDate() + 30);

  const { data } = await calendar.events.list({
    calendarId,
    timeMin: now.toISOString(),
    timeMax: in30.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 50,
  });

  return (data.items ?? []).map((ev) => ({
    id: `${calendarKey}-${ev.id}`,
    title: ev.summary ?? '(sem título)',
    start: ev.start?.dateTime ?? ev.start?.date ?? now.toISOString(),
    end: ev.end?.dateTime ?? ev.end?.date ?? now.toISOString(),
    htmlLink: ev.htmlLink ?? undefined,
    calendar: calendarKey,
  }));
}

const DEFAULT_EMBED_RAFAEL =
  'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FSao_Paulo&src=cmFmYWVsc2FudG9zY2F2YWxjYW50ZTIyQGdtYWlsLmNvbQ&src=MTFhZmM0NmFjMGFhNDgyZTJmNTk0OWZiNWJiODc5NDYxODJjZGU2MjFkZDRkYmUwOGU2Njc5ODY3MTRhNDM0MkBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=MTQzZDUyZjBkMDE2YzdlNzY2YjI2MDkzN2E1YzYzMzFiYzc4ZTY3ZmQ4ZDM2Njg3YThiMTJhNTliNjg5NTNjYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=NDY1ZWUxYjBjMjIyMDI5OTE4OGI3YmJkZjE0N2FmN2U0YmE2MzJkMGIzNmZiNWE4MTMwMGZhMDlkNTRlY2ZlOUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ODZjMmFjYTU3MDNjZGU4M2VjNTEyMDJiOTYxZDI4YWM0YmUwNGRiOTRiNDlmZWU2Mzg0YzBmZTQxM2RiZTE2MEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=Y2xhc3Nyb29tMTEwNDAzMDgxMDgyOTM3MDY0Mjc5QGdyb3VwLmNhbGVuZGFyLmdvb2dsZS5jb20&src=ZGY4M2MwMjI3NDdiZmJlYTc2NDlmZGMwOWU2Mjg4MmQ5ZTdjNjU3MDRhMWEwNzIxZDgxODhiOWQxOGY0ZGQzOEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZTJlYzNhOTEzZWU5MmM0Mzk3ZTEzNjFmYzZhMGE3MWRlYjE5NTgzOThkODk1NDkzYjFhMmQ3NmJlNTU5NjcwYUBncm91cC5jYWxlbmRhci5nb29nbGUuY29t&src=ZmFtaWx5MDY4NTAxMjQ1OTU2NTE4MzQ0MjJAZ3JvdXAuY2FsZW5kYXIuZ29vZ2xlLmNvbQ&color=%23039be5&color=%237cb342&color=%23d81b60&color=%238e24aa&color=%237cb342&color=%23a79b8e&color=%23f4511e&color=%23f09300&color=%23f09300';

const DEFAULT_EMBED_VINICIUS =
  'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FFortaleza&showPrint=0&title=Vin%C3%ADcius%20-%20Google%20Agenda&hl=pt_BR&mode=MONTH&src=viniciussantosdemorais2002%40gmail.com&color=%23039be5';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const embedRafael = process.env.GOOGLE_CALENDAR_EMBED_RAFAEL ?? DEFAULT_EMBED_RAFAEL;
  const embedVinicius =
    process.env.GOOGLE_CALENDAR_EMBED_VINICIUS ?? DEFAULT_EMBED_VINICIUS;
  const idRafael =
    process.env.GOOGLE_CALENDAR_ID_RAFAEL ?? 'rafaelsantoscavalcante22@gmail.com';
  const idVinicius =
    process.env.GOOGLE_CALENDAR_ID_VINICIUS ?? 'viniciussantosdemorais2002@gmail.com';
  const view = (req.query.view as string) ?? 'combinado';

  const hasServiceAccount = Boolean(parseServiceAccount());
  const hasEmbed = Boolean(embedRafael || embedVinicius);

  if (!hasServiceAccount && !hasEmbed) {
    return res.status(200).json({
      configured: false,
      events: [],
      useEmbed: false,
    });
  }

  if (hasEmbed && !hasServiceAccount) {
    return res.status(200).json({
      configured: true,
      useEmbed: true,
      embedRafael,
      embedVinicius,
      events: [],
      view,
    });
  }

  try {
    const [rafaelEvents, viniciusEvents] = await Promise.all([
      fetchGoogleEvents(idRafael, 'rafael'),
      fetchGoogleEvents(idVinicius, 'vinicius'),
    ]);
    const events = [...rafaelEvents, ...viniciusEvents].sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );

    return res.status(200).json({
      configured: true,
      useEmbed: hasEmbed,
      embedRafael,
      embedVinicius,
      events,
      view,
    });
  } catch (e) {
    return res.status(500).json({
      error: e instanceof Error ? e.message : 'Erro Google Calendar',
    });
  }
}
