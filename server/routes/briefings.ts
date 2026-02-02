import { Router } from 'express';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.get('/', (_req, res) => {
  try {
    const data = JSON.parse(
      readFileSync(path.resolve(__dirname, '..', 'data', 'briefings.json'), 'utf-8')
    );
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read briefings data' });
  }
});

export default router;
