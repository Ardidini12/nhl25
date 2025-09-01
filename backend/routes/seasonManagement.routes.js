import { Router } from 'express';
import authorize from '../middlewares/auth.middleware.js';
import adminAuth from '../middlewares/admin.middleware.js';
import {
  addClubToSeason,
  removeClubFromSeason,
  getSeasonClubs,
  addPlayerToSeason,
  removePlayerFromSeason,
  getSeasonPlayers,
  getAvailableClubsForSeason,
  getAvailablePlayersForSeason,
  createClubAndAddToSeason,
  createPlayerAndAddToSeason,
  updateClubAssignment,
  updatePlayerAssignment,
  updatePlayerClubAssignment
} from '../controllers/seasonManagement.controller.js';

const seasonManagementRouter = Router();

// Admin-only routes
seasonManagementRouter.use(authorize);
seasonManagementRouter.use(adminAuth);

// Create and associate in one operation
seasonManagementRouter.post('/clubs/create', createClubAndAddToSeason);
seasonManagementRouter.post('/players/create', createPlayerAndAddToSeason);

// Season-Club management
seasonManagementRouter.post('/clubs', addClubToSeason);
seasonManagementRouter.delete('/clubs/:seasonId/:clubId', removeClubFromSeason);
seasonManagementRouter.get('/clubs/:seasonId', getSeasonClubs);
seasonManagementRouter.get('/clubs/available/:seasonId', getAvailableClubsForSeason);

// Season-Player management
seasonManagementRouter.post('/players', addPlayerToSeason);
seasonManagementRouter.delete('/players/:seasonId/:playerId', removePlayerFromSeason);
seasonManagementRouter.get('/players/:seasonId', getSeasonPlayers);
seasonManagementRouter.get('/players/available/:seasonId', getAvailablePlayersForSeason);

// Assignment status management
seasonManagementRouter.put('/clubs/:seasonId/:clubId/assignment', updateClubAssignment);
seasonManagementRouter.put('/players/:seasonId/:playerId/assignment', updatePlayerAssignment);

// Roster management (player-club assignments)
seasonManagementRouter.put('/roster/players/:playerId/club', updatePlayerClubAssignment);

export default seasonManagementRouter; 