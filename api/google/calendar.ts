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

const DEFAULT_EMBED_VINICIUS =
  'https://calendar.google.com/calendar/embed?height=600&wkst=1&ctz=America%2FFortaleza&showPrint=0&title=Vin%C3%ADcius%20-%20Google%20Agenda&hl=pt_BR&mode=MONTH&src=viniciussantosdemorais2002%40gmail.com&color=%23039be5';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const embedRafael = process.env.GOOGLE_CALENDAR_EMBED_RAFAEL ?? '';
  const embedVinicius =
    process.env.GOOGLE_CALENDAR_EMBED_VINICIUS ?? DEFAULT_EMBED_VINICIUS;
  const idRafael = process.env.GOOGLE_CALENDAR_ID_RAFAEL ?? 'rafael@nexustech.com';
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
