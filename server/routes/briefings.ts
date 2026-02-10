import { Router } from 'express';
import { readDataFile } from '../utils.js';
import { sendSuccess, sendServerError } from '../utils/response.js';

const router = Router();

/**
 * @swagger
 * /api/briefings:
 *   get:
 *     summary: Get morning briefings
 *     description: Returns daily security briefings with highlights
 *     tags: [Briefings]
 *     responses:
 *       200:
 *         description: Briefing data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Briefing'
 *       500:
 *         description: Server error
 */
router.get('/', (_req, res) => {
  try {
    const data = readDataFile('briefings.json', []);
    sendSuccess(res, data);
  } catch {
    sendServerError(res, 'Failed to read briefings data');
  }
});

export default router;
