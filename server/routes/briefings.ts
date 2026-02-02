import { Router } from 'express';
import { readDataFile } from '../utils.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const data = readDataFile('briefings.json', []);
    res.json(data);
  } catch {
    res.status(500).json({ error: 'Failed to read briefings data' });
  }
});

export default router;
