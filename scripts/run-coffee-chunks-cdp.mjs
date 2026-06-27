/**
 * Processa chunks 000-017: navega, Runtime.evaluate (CDP), extrai e salva imagens.
 * Equivalente ao fluxo browser_cdp + cdp-extract-and-save.mjs.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const CHUNKS_DIR = join(__dirname, 'coffee-download-batches', 'chunks');
const BROWSER_LOGS = join(process.env.USERPROFILE || process.env.HOME, '.cursor', 'browser-logs');

function chunkUrl(items) {
  const systems = [...new Set(items.map((x) => x.system))];
  if (systems.includes('dolce-gusto')) return 'https://www.nescafe-dolcegusto.com.br/sabores';
  if (systems.includes('nespresso')) return 'https://www.nespresso.com/br/pt/order/capsules/original';
  return 'https://www.mercafe.com.br/';
}

function latestCdpFile(afterMs) {
  mkdirSync(BROWSER_LOGS, { recursive: true });
  const files = readdirSync(BROWSER_LOGS)
    .filter((f) => f.startsWith('cdp-response-Runtime.evaluate-') && f.endsWith('.json'))
    .map((f) => ({ f, m: statSync(join(BROWSER_LOGS, f)).mtimeMs }))
    .filter((x) => x.m >= afterMs - 500)
    .sort((a, b) => b.m - a.m);
  return files[0]?.f ? join(BROWSER_LOGS, files[0].f) : null;
}

async function main() {
  const { chromium } = await import('playwright');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const context = await browser.newContext({
    locale: 'pt-BR',
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  const results = [];

  for (let i = 0; i < 18; i++) {
    const n = String(i).padStart(3, '0');
    const chunkJson = join(CHUNKS_DIR, `chunk-${n}.json`);
    const chunkExpr = join(CHUNKS_DIR, `chunk-${n}.expr.txt`);
    const items = JSON.parse(readFileSync(chunkJson, 'utf8'));
    const expression = readFileSync(chunkExpr, 'utf8').trim();
    const url = chunkUrl(items);

    console.log(`\n=== chunk-${n} → ${url} ===`);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      const before = Date.now();
      const evalResult = await cdp.send('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
      });

      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      const cdpFile = join(BROWSER_LOGS, `cdp-response-Runtime.evaluate-${ts}.json`);
      mkdirSync(BROWSER_LOGS, { recursive: true });
      writeFileSync(cdpFile, JSON.stringify({ result: evalResult.result }));

      const r = spawnSync('node', ['scripts/cdp-extract-and-save.mjs', cdpFile], {
        cwd: ROOT,
        stdio: 'inherit',
        encoding: 'utf8',
      });

      const ok = r.status === 0;
      results.push({ chunk: n, ok, url, cdpFile });
      console.log(ok ? `✓ chunk-${n} OK` : `✗ chunk-${n} extract failed (exit ${r.status})`);
    } catch (err) {
      console.error(`✗ chunk-${n}: ${err.message}`);
      results.push({ chunk: n, ok: false, url, error: err.message });
    }
  }

  await browser.close();

  const succeeded = results.filter((r) => r.ok).length;
  console.log(`\n=== DONE: ${succeeded}/18 chunks succeeded ===`);
  for (const r of results) {
    console.log(`  chunk-${r.chunk}: ${r.ok ? 'OK' : 'FAIL'}${r.error ? ` (${r.error})` : ''}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
