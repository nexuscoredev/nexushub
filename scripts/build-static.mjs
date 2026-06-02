import { cpSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const out = join(root, 'dist');
const skip = new Set(['.git', '.vercel', 'dist', 'node_modules', 'scripts', 'design.md', 'package.json', 'package-lock.json', '.gitignore', '.vercelignore']);

mkdirSync(out, { recursive: true });

for (const name of readdirSync(root)) {
  if (skip.has(name)) continue;
  const src = join(root, name);
  if (!statSync(src).isFile() && !statSync(src).isDirectory()) continue;
  cpSync(src, join(out, name), { recursive: true });
}

if (!existsSync(join(out, 'index.html'))) {
  console.error('build-static: index.html missing in dist');
  process.exit(1);
}

console.log('Static build copied to dist/');
