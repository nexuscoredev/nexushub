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

/**
 * Repositórios que o JARVIS pode acessar (até 20, limite da API de Cloud Agents).
 * - `JARVIS_CURSOR_REPOS`: lista separada por vírgula (ex: "url1,url2"). Cada item
 *   aceita o formato "url" ou "url#ref" para fixar branch/SHA.
 * - `JARVIS_CURSOR_REPO` (legado): um único repo, com ref em `JARVIS_CURSOR_REPO_REF`.
 */
function optionalRepos():
  | Array<{ url: string; startingRef?: string }>
  | undefined {
  const defaultRef = process.env.JARVIS_CURSOR_REPO_REF?.trim() || 'main';
  const list = process.env.JARVIS_CURSOR_REPOS?.trim();

  if (list) {
    const repos = list
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, 20)
      .map((entry) => {
        const [url, ref] = entry.split('#').map((p) => p.trim());
        return { url, startingRef: ref || defaultRef };
      })
      .filter((r) => /^https?:\/\//i.test(r.url));
    return repos.length ? repos : undefined;
  }

  const url = process.env.JARVIS_CURSOR_REPO?.trim();
  if (!url) return undefined;
  return [{ url, startingRef: defaultRef }];
}

interface CursorMcpServer {
  name: string;
  type?: 'http' | 'sse' | 'stdio';
  url?: string;
  headers?: Record<string, string>;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
}

/**
 * Servidores MCP disponíveis ao JARVIS (Supabase, Vercel, etc.), até 50.
 * Definidos em `JARVIS_MCP_SERVERS` como JSON (array no formato da API de Cloud Agents).
 * Mantém-se desligado se a env estiver ausente ou inválida.
 */
function optionalMcpServers(): CursorMcpServer[] | undefined {
  const raw = process.env.JARVIS_MCP_SERVERS?.trim();
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return undefined;

    const servers = parsed
      .filter((s): s is CursorMcpServer => {
        if (!s || typeof s !== 'object') return false;
        const cand = s as CursorMcpServer;
        return typeof cand.name === 'string' && (Boolean(cand.url) || Boolean(cand.command));
      })
      .slice(0, 50);

    return servers.length ? servers : undefined;
  } catch {
    console.error('[cursorAgent] JARVIS_MCP_SERVERS inválido (JSON malformado)');
    return undefined;
  }
}

export interface JarvisAgentConfig {
  /** Repo selecionado para esta sessão (sobrepõe a config padrão por env). */
  repoUrl?: string;
  repoRef?: string;
  /** Nome amigável do agente (ex: "JARVIS — cliente X / repo Y"). */
  name?: string;
}

function resolveRepos(
  config?: JarvisAgentConfig,
): Array<{ url: string; startingRef?: string }> | undefined {
  if (config?.repoUrl && /^https?:\/\//i.test(config.repoUrl)) {
    return [{ url: config.repoUrl, startingRef: config.repoRef?.trim() || 'main' }];
  }
  return optionalRepos();
}

export async function createJarvisAgent(
  promptText: string,
  config?: JarvisAgentConfig,
): Promise<{
  agentId: string;
  runId: string;
}> {
  const repos = resolveRepos(config);
  const mcpServers = optionalMcpServers();
  const body: Record<string, unknown> = {
    name: config?.name?.slice(0, 100) || 'JARVIS — NEXUS Hub',
    prompt: { text: promptText },
    model: jarvisModel(),
    autoCreatePR: false,
  };
  if (repos?.length) body.repos = repos;
  if (mcpServers?.length) body.mcpServers = mcpServers;

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
