import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import {
  createLeague,
  getAllLeagues,
  getLeague,
  updateLeague,
  deleteLeague
} from '../controllers/league.controller.js';

const leagueRouter = Router();

// Admin-only routes
leagueRouter.use(authorize);
leagueRouter.use(adminAuth);

leagueRouter.post('/', createLeague);
leagueRouter.get('/', getAllLeagues);
leagueRouter.get('/:id', getLeague);
leagueRouter.put('/:id', updateLeague);
leagueRouter.delete('/:id', deleteLeague);

export default leagueRouter; 