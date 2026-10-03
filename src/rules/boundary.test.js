import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const rulesDir = dirname(fileURLToPath(import.meta.url));

describe('rules boundary', () => {
  it('only imports sibling rule files, never AI, storage or UI code', () => {
    const files = readdirSync(rulesDir).filter((f) => f.endsWith('.js') && !f.endsWith('.test.js'));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(join(rulesDir, file), 'utf8');
      for (const [, path] of source.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(path, `${file} imports ${path}`).toMatch(/^\.\/[a-zA-Z]+\.js$/);
      }
    }
  });
});
