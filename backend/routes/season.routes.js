import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import {
  createSeason,
  getAllSeasons,
  getSeason,
  updateSeason,
  deleteSeason
} from '../controllers/season.controller.js';

const seasonRouter = Router();

// Admin-only routes
seasonRouter.use(authorize);
seasonRouter.use(adminAuth);

seasonRouter.post('/', createSeason);
seasonRouter.get('/', getAllSeasons);
seasonRouter.get('/:id', getSeason);
seasonRouter.put('/:id', updateSeason);
seasonRouter.delete('/:id', deleteSeason);

export default seasonRouter; 