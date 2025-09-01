import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import {
  createPlayer,
  getAllPlayers,
  getPlayer,
  updatePlayer,
  deletePlayer
} from '../controllers/player.controller.js';

const playerRouter = Router();

// Admin-only routes
playerRouter.use(authorize);
playerRouter.use(adminAuth);

playerRouter.post('/', createPlayer);
playerRouter.get('/', getAllPlayers);
playerRouter.get('/:id', getPlayer);
playerRouter.put('/:id', updatePlayer);
playerRouter.delete('/:id', deletePlayer);

export default playerRouter; 