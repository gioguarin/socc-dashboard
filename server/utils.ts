import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Read a JSON data file, falling back to the .example.json version
 * if the runtime file doesn't exist yet (before first pipeline run).
 */
export function readDataFile<T>(filename: string, fallback: T): T {
  const primary = path.resolve(__dirname, 'data', filename);
  const example = path.resolve(__dirname, 'data', filename.replace('.json', '.example.json'));

  for (const filepath of [primary, example]) {
    if (existsSync(filepath)) {
      try {
        return JSON.parse(readFileSync(filepath, 'utf-8'));
      } catch {
        continue;
      }
    }
  }

  return fallback;
}
