const CURSOR_API_BASE = 'https://api.cursor.com';

export interface CursorRunTerminal {
  id: string;
  agentId: string;
  status: string;
  result?: string;
  durationMs?: number;
}

function cursorApiKey(): string | undefined {
  return process.env.CURSOR_API_KEY?.trim() || process.env.JARVIS_CURSOR_API_KEY?.trim();
}

function authHeader(apiKey: string): string {
  const basic = Buffer.from(`${apiKey}:`).toString('base64');
  return `Basic ${basic}`;
}

async function cursorFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const apiKey = cursorApiKey();
  if (!apiKey) throw new CursorConfigError('CURSOR_API_KEY não configurada');

  const res = await fetch(`${CURSOR_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: authHeader(apiKey),
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new CursorApiError(res.status, body);
  }

  return (await res.json()) as T;
}

export class CursorConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CursorConfigError';
  }
}

export class CursorApiError extends Error {
  status: number;
  constructor(status: number, body: string) {
    super(`Cursor API ${status}: ${body.slice(0, 400)}`);
    this.name = 'CursorApiError';
    this.status = status;
  }
}

export class CursorRunError extends Error {
  status: string;
  constructor(status: string) {
    super(`Cursor run terminou com status ${status}`);
    this.name = 'CursorRunError';
    this.status = status;
  }
}

export class CursorRunTimeoutError extends Error {
  constructor() {
    super('JARVIS demorou demais para responder. Tente novamente.');
    this.name = 'CursorRunTimeoutError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function jarvisModel(): { id: string; params?: Array<{ id: string; value: string }> } | undefined {
  const id = process.env.JARVIS_CURSOR_MODEL?.trim();
  if (!id) return { id: 'auto' };
  if (id === 'composer-2-fast') {
    return { id: 'composer-2', params: [{ id: 'fast', value: 'true' }] };
  }
  return { id };
}

function optionalRepos():
  | Array<{ url: string; startingRef?: string }>
  | undefined {
  const url = process.env.JARVIS_CURSOR_REPO?.trim();
  const ref = process.env.JARVIS_CURSOR_REPO_REF?.trim() || 'main';
  if (!url) return undefined;
  return [{ url, startingRef: ref }];
}

export async function createJarvisAgent(promptText: string): Promise<{
  agentId: string;
  runId: string;
}> {
  const repos = optionalRepos();
  const body: Record<string, unknown> = {
    name: 'JARVIS — NEXUS Hub',
    prompt: { text: promptText },
    model: jarvisModel(),
    autoCreatePR: false,
  };
  if (repos?.length) body.repos = repos;

  const data = await cursorFetch<{
    agent: { id: string };
    run: { id: string };
  }>('/v1/agents', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  return { agentId: data.agent.id, runId: data.run.id };
}

export async function continueJarvisAgent(
  agentId: string,
  promptText: string,
): Promise<{ runId: string }> {
  const data = await cursorFetch<{ run: { id: string } }>(
    `/v1/agents/${encodeURIComponent(agentId)}/runs`,
    {
      method: 'POST',
      body: JSON.stringify({ prompt: { text: promptText } }),
    },
  );
  return { runId: data.run.id };
}

export async function getJarvisRun(agentId: string, runId: string): Promise<CursorRunTerminal> {
  return cursorFetch<CursorRunTerminal>(
    `/v1/agents/${encodeURIComponent(agentId)}/runs/${encodeURIComponent(runId)}`,
  );
}

export async function waitForJarvisRun(
  agentId: string,
  runId: string,
  maxMs = 55_000,
): Promise<string> {
  const terminal = new Set(['FINISHED', 'ERROR', 'CANCELLED', 'EXPIRED']);
  const start = Date.now();

  while (Date.now() - start < maxMs) {
    const run = await getJarvisRun(agentId, runId);
    if (run.status === 'FINISHED') {
      return run.result?.trim() ?? '';
    }
    if (terminal.has(run.status) && run.status !== 'FINISHED') {
      throw new CursorRunError(run.status);
    }
    await sleep(1800);
  }

  throw new CursorRunTimeoutError();
}

export function isCursorConfigured(): boolean {
  return Boolean(cursorApiKey());
}
