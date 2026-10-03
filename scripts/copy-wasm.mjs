// Copies the LiteRT-LM WASM runtime into public/litertlm so the app serves it
// itself: it works offline and needs no third-party CDN. public/litertlm is git-ignored.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const from = join(root, 'node_modules', '@litert-lm', 'core', 'wasm');
const to = join(root, 'public', 'litertlm');

if (!existsSync(from)) {
  console.error(`LiteRT-LM WASM not found at ${from}. Run npm install first.`);
  process.exit(1);
}
mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`Copied LiteRT-LM WASM to ${to}`);
