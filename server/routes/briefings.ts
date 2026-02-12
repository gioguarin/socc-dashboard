import { Router } from 'express';
import { sendSuccess, sendBadRequest, sendServerError } from '../utils/response.js';
import { buildBriefing } from '../briefing/generator.js';
import { saveBriefing, getAllBriefings } from '../briefing/store.js';

const router = Router();

/**
 * @swagger
 * /api/briefings:
 *   get:
 *     summary: Get all briefings
 *     description: Returns daily security briefings from SQLite, most recent first
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
router.get('/', async (_req, res) => {
  try {
    let briefings = getAllBriefings();

    // Auto-generate one on first visit so the panel isn't empty
    if (briefings.length === 0) {
      const generated = await buildBriefing();
      saveBriefing(generated);
      briefings = [generated];
    }

    sendSuccess(res, briefings);
  } catch {
    sendServerError(res, 'Failed to read briefings');
  }
});

/**
 * @swagger
 * /api/briefings/generate:
 *   post:
 *     summary: Generate a new briefing
 *     description: Generates a rich security briefing from current data and stores it
 *     tags: [Briefings]
 *     responses:
 *       201:
 *         description: Briefing created
 *       400:
 *         description: Cooldown not elapsed
 *       500:
 *         description: Server error
 */
router.post('/generate', async (_req, res) => {
  try {
    // 60-second cooldown between generations
    const recent = getAllBriefings(1);
    if (recent.length > 0) {
      const lastCreated = new Date(recent[0].createdAt).getTime();
      const cooldownMs = 60_000;
      if (Date.now() - lastCreated < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - (Date.now() - lastCreated)) / 1000);
        sendBadRequest(res, `Please wait ${remaining}s before generating another briefing`);
        return;
      }
    }

    const briefing = await buildBriefing();
    saveBriefing(briefing);
    sendSuccess(res, briefing, { status: 201 });
  } catch {
    sendServerError(res, 'Failed to generate briefing');
  }
});

export default router;
