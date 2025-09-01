import { Router } from 'express';
import League from '../models/league.model.js';
import Season from '../models/season.model.js';
import Club from '../models/club.model.js';
import Player from '../models/player.model.js';
import SeasonClub from '../models/seasonClub.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';

const publicRouter = Router();

// Public routes for viewing data (no authentication required)

// Get all active leagues
publicRouter.get('/leagues', async (req, res) => {
  try {
    const leagues = await League.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: leagues
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all seasons for a league (only active seasons for public view)
publicRouter.get('/leagues/:leagueId/seasons', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const seasons = await Season.find({ 
      league: leagueId, 
      isActive: true 
    }).sort({ startDate: -1 });
    
    res.status(200).json({
      success: true,
      data: seasons
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all clubs
publicRouter.get('/clubs', async (req, res) => {
  try {
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 });
    res.status(200).json({
      success: true,
      data: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get all players
publicRouter.get('/players', async (req, res) => {
  try {
    const { clubId } = req.query;
    let query = { isActive: true };
    
    if (clubId) {
      query.currentClub = clubId;
    }

    const players = await Player.find(query)
      .populate('currentClub', 'name')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get clubs for a specific season (only assigned clubs for public view)
publicRouter.get('/seasons/:seasonId/clubs', async (req, res) => {
  try {
    const { seasonId } = req.params;
    
    // Only return assigned clubs for public viewing
    const seasonClubs = await SeasonClub.find({ 
      season: seasonId,
      isAssigned: true 
    })
      .populate('club', 'name webUrl description')
      .sort({ 'club.name': 1 });

    const clubs = seasonClubs
      .filter(sc => sc.club) // Filter out null clubs
      .map(sc => sc.club);

    res.status(200).json({
      success: true,
      data: clubs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

// Get players for a specific season (only players in assigned clubs for public view)
publicRouter.get('/seasons/:seasonId/players', async (req, res) => {
  try {
    const { seasonId } = req.params;
    
    // Get all assigned clubs for this season
    const assignedClubIds = await SeasonClub.find({ 
      season: seasonId,
      isAssigned: true 
    }).distinct('club');
    
    const seasonPlayers = await SeasonPlayer.find({ 
      season: seasonId,
      isAssigned: true 
    })
      .populate({
        path: 'player',
        select: 'name position jerseyNumber currentClub',
        populate: {
          path: 'currentClub',
          select: 'name _id'
        }
      })
      .sort({ 'player.name': 1 });

    // Return players in assigned clubs AND free agents (but exclude players in unassigned clubs)
    const players = seasonPlayers
      .filter(sp => sp.player) // Filter out null players
      .map(sp => sp.player)
      .filter(player => {
        // Include free agents (no club) or players in assigned clubs
        // Exclude players in unassigned clubs
        if (!player.currentClub) {
          return true; // Free agents - show in public view
        }
        return assignedClubIds.includes(player.currentClub._id); // Only assigned clubs
      });

    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
});

export default publicRouter; 