import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import {
  createClub,
  getAllClubs,
  getClub,
  updateClub,
  deleteClub
} from '../controllers/club.controller.js';

const clubRouter = Router();

// Admin-only routes
clubRouter.use(authorize);
clubRouter.use(adminAuth);

clubRouter.post('/', createClub);
clubRouter.get('/', getAllClubs);
clubRouter.get('/:id', getClub);
clubRouter.put('/:id', updateClub);
clubRouter.delete('/:id', deleteClub);

export default clubRouter; 