const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

async function scrape(url, label) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  const html = await r.text();
  const links = [
    ...html.matchAll(/href="(https:\/\/www\.cafe3coracoes\.com\.br\/nossos-produtos\/capsulas\/[^"#?]+)/gi),
  ].map((m) => m[1]);
  console.log(`\n=== ${label} (${r.status}) — ${[...new Set(links)].length} links ===`);
  for (const l of [...new Set(links)].sort()) console.log(l);
  return html;
}

const compatHtml = await scrape(
  'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/',
  'compat',
);
await scrape('https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/', 'tres');

// Extract product names + images from compat page
const products = [...compatHtml.matchAll(/<h[23][^>]*>([^<]+)<\/h[23]>/gi)].map((m) => m[1].trim());
console.log('\nCompat headings:', products.filter((p) => p.includes('Cápsula') || p.includes('Espresso')));

// Mercafé HTML search
const merc = await fetch('https://www.mercafe.com.br/capsulas-compativeis-nespresso', {
  headers: { 'User-Agent': UA },
});
const mercHtml = await merc.text();
const mercLinks = [...mercHtml.matchAll(/href="(\/[^"]*tres[^"]*\/p)"/gi)].map((m) => m[1]);
console.log('\nMercafé product paths', [...new Set(mercLinks)].length);
for (const p of [...new Set(mercLinks)].sort()) console.log('https://www.mercafe.com.br' + p);

// Nespresso BR - try __NEXT_DATA__ or JSON
const ns = await fetch('https://www.nespresso.com/br/pt/order/capsules/original', {
  headers: { 'User-Agent': UA, Accept: 'text/html' },
});
const nsHtml = await ns.text();
console.log('\nNespresso BR', ns.status, nsHtml.length);
const nextData = nsHtml.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextData) console.log('Has __NEXT_DATA__', nextData[1].slice(0, 200));
const sysMaster = [...nsHtml.matchAll(/sys_master\/public\/(\d+)\/([^"'\s?]+\.(?:png|jpg|webp))/gi)];
const names = [...nsHtml.matchAll(/"displayName"\s*:\s*"([^"]+)"/g)].map((m) => m[1]);
console.log('displayName count', [...new Set(names)].length);
console.log([...new Set(names)].sort().join('\n'));
console.log('sys_master images', sysMaster.length);
