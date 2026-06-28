import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = 'public/img/personal/coffee/catalog/dolce-gusto';
const bad = [];
for (const slug of readdirSync(root)) {
  const dir = join(root, slug);
  for (const file of ['box.jpg', 'capsule.jpg']) {
    const p = join(dir, file);
    try {
      const size = statSync(p).size;
      if (size < 12000) bad.push({ slug, file, size });
    } catch {
      /* skip */
    }
  }
}
console.log('broken', bad.length);
bad.forEach((b) => console.log(b.slug, b.file, b.size));
