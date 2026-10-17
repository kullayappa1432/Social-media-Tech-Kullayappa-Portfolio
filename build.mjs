import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, 'dist');
mkdirSync(output, { recursive: true });
for (const entry of ['index.html', 'favicon.svg', 'css', 'js', 'assets']) {
  cpSync(path.join(root, entry), path.join(output, entry), { recursive: true });
}
console.log('Static website prepared in dist/.');
