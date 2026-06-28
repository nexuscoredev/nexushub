/**
 * Extrai imagens das páginas café3coracoes para cápsulas TRES e compatíveis.
 * node scripts/scrape-tres-product-images.mjs
 */
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

const PAGES = [
  { slug: 'cafe-filtrado', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cafe-filtrado/', system: 'tres-coracoes', name: 'Café Filtrado' },
  { slug: 'cha-hibisco-maca', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/tres/cha-hibisco-e-maca/', system: 'tres-coracoes', name: 'Chá Hibisco e Maçã' },
  { slug: 'compat-intenso', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-intenso/', system: 'nespresso', name: 'Espresso Intenso', brand: 'Três Corações' },
  { slug: 'compat-cerrado-mineiro', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-cerrado-mineiro/', system: 'nespresso', name: 'Espresso Cerrado Mineiro', brand: 'Três Corações' },
  { slug: 'compat-mogiana-paulista', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-mogiana-paulista/', system: 'nespresso', name: 'Espresso Mogiana Paulista', brand: 'Três Corações' },
  { slug: 'compat-organico', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-organico/', system: 'nespresso', name: 'Espresso Orgânico', brand: 'Três Corações' },
  { slug: 'compat-descafeinado', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/espresso-descafeinado/', system: 'nespresso', name: 'Espresso Descafeinado', brand: 'Três Corações' },
  { slug: 'compat-maximo', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-maximo/', system: 'nespresso', name: 'Espresso Máximo', brand: 'Três Corações' },
  { slug: 'compat-peru', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-peru/', system: 'nespresso', name: 'Espresso Regiões do Mundo Peru', brand: 'Três Corações' },
  { slug: 'compat-colombia', url: 'https://www.cafe3coracoes.com.br/nossos-produtos/capsulas/compativeis/capsula-de-espresso-regioes-do-mundo-colombia/', system: 'nespresso', name: 'Espresso Regiões do Mundo Colômbia', brand: 'Três Corações' },
];

const results = {};
for (const page of PAGES) {
  const r = await fetch(page.url, { headers: { 'User-Agent': UA } });
  const html = await r.text();
  const imgs = [
    ...html.matchAll(/https?:\/\/[^"'\s]+\.(?:png|jpg|webp)(?:\?[^"'\s]*)?/gi),
  ].map((m) => m[0]);
  const productImgs = [...new Set(imgs)].filter(
    (u) =>
      /cafe3coracoes|mercafefaststore|vtexassets/i.test(u) &&
      !/logo|icon|banner|menu|sprite|avatar|social/i.test(u),
  );
  const intensity = html.match(/intensidade[^0-9]*(\d{1,2})/i)?.[1];
  results[page.slug] = { ...page, intensity: intensity ? Number(intensity) : null, images: productImgs.slice(0, 6) };
  console.log(`\n${page.name} (${productImgs.length} imgs)`);
  productImgs.slice(0, 4).forEach((u) => console.log(' ', u));
}

console.log('\n--- JSON ---');
console.log(JSON.stringify(results, null, 2));
