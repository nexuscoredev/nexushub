/**
 * Executa fetch no browser via arquivo .expr.txt (gerado por make-browser-fetch-expression.mjs)
 * e salva imagens. Requer Playwright com channel chrome headless:false OU payload pré-baixado.
 *
 * Fluxo browser CDP manual:
 *   node scripts/make-browser-fetch-expression.mjs batch.json batch.expr.txt
 *   (no browser CDP: awaitPromise + expression do .expr.txt)
 *   node scripts/save-coffee-browser-payload.mjs batch.payload.json
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

const exprFile = process.argv[2];
const payloadOut = process.argv[3];
if (!exprFile || !payloadOut) {
  console.error(
    'Uso: node scripts/run-browser-fetch-and-save.mjs <batch.expr.txt> <batch.payload.json>',
  );
  process.exit(1);
}

const expression = readFileSync(exprFile, 'utf8');
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: false,
  ignoreDefaultArgs: ['--enable-automation'],
  args: ['--disable-blink-features=AutomationControlled'],
});
const page = await browser.newPage();
await page.goto('https://www.nescafe-dolcegusto.com.br/sabores', {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
await page.waitForTimeout(4000);

const json = await page.evaluate(async (expr) => {
  // eslint-disable-next-line no-eval
  return await eval(expr);
}, expression);

const { writeFileSync } = await import('node:fs');
writeFileSync(payloadOut, json);
console.log('Payload →', payloadOut, 'bytes', json.length);
await browser.close();
