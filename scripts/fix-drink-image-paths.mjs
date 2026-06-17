import fs from 'fs';

const path = 'src/lib/viniciusDrinksCarta.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  /imageUrl:\s*\n\s*'https:\/\/lh3\.googleusercontent\.com[^']+'/g,
  (match, offset) => {
    const before = content.slice(Math.max(0, offset - 200), offset);
    const slugMatch = before.match(/slug: '([^']+)'/);
    const slug = slugMatch?.[1] ?? 'unknown';
    return `imageUrl: drinkImagePath('${slug}')`;
  },
);

fs.writeFileSync(path, content);
console.log('updated imageUrl paths');
