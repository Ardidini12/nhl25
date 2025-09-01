import League from '../models/league.model.js';
import Season from '../models/season.model.js';
import SeasonClub from '../models/seasonClub.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';
import Club from '../models/club.model.js';
import Player from '../models/player.model.js';

export const createLeague = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    const league = await League.create({
      name,
      description
    });

    res.status(201).json({
      success: true,
      message: 'League created successfully',
      data: league
    });
  } catch (error) {
    next(error);
  }
};

export const getAllLeagues = async (req, res, next) => {
  try {
    const leagues = await League.find({ isActive: true }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: leagues
    });
  } catch (error) {
    next(error);
  }
};

export const getLeague = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const league = await League.findById(id);
    
    if (!league) {
      const error = new Error('League not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: league
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeague = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, isActive } = req.body;

    const league = await League.findByIdAndUpdate(
      id,
      { name, description, isActive },
      { new: true, runValidators: true }
    );

    if (!league) {
      const error = new Error('League not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'League updated successfully',
      data: league
    });
  } catch (error) {
    next(error);
  }
};

export const deleteLeague = async (req, res, next) => {
  try {
    const { id } = req.params;

    const league = await League.findByIdAndDelete(id);

    if (!league) {
      const error = new Error('League not found');
      error.statusCode = 404;
      throw error;
    }

    // Cascade delete: Find all seasons in this league
    const seasons = await Season.find({ league: id });
    const seasonIds = seasons.map(season => season._id);

    if (seasonIds.length > 0) {
      // Get all clubs and players associated with these seasons
      const seasonClubs = await SeasonClub.find({ season: { $in: seasonIds } });
      const seasonPlayers = await SeasonPlayer.find({ season: { $in: seasonIds } });
      
      const clubIds = seasonClubs.map(sc => sc.club);
      const playerIds = seasonPlayers.map(sp => sp.player);

      // Delete all season-club and season-player associations first
      await SeasonClub.deleteMany({ season: { $in: seasonIds } });
      await SeasonPlayer.deleteMany({ season: { $in: seasonIds } });
      
      // For each club, check if it exists in other seasons
      for (const clubId of clubIds) {
        const otherSeasonClubs = await SeasonClub.findOne({ 
          club: clubId, 
          season: { $nin: seasonIds } 
        });
        
        if (!otherSeasonClubs) {
          // Club doesn't exist in other seasons, delete it completely
          await Club.findByIdAndDelete(clubId);
        } else {
          // Club exists in other seasons, just remove the season reference
          await Club.updateOne(
            { _id: clubId },
            { $unset: { season: 1 } }
          );
        }
      }

      // For each player, check if it exists in other seasons
      for (const playerId of playerIds) {
        const otherSeasonPlayers = await SeasonPlayer.findOne({ 
          player: playerId, 
          season: { $nin: seasonIds } 
        });
        
        if (!otherSeasonPlayers) {
          // Player doesn't exist in other seasons, delete it completely
          await Player.findByIdAndDelete(playerId);
        } else {
          // Player exists in other seasons, just remove the season reference and reset club
          await Player.updateOne(
            { _id: playerId },
            { $unset: { season: 1 }, $set: { currentClub: null } }
          );
        }
      }
    }

    // Delete all seasons in this league
    await Season.deleteMany({ league: id });

    res.status(200).json({
      success: true,
      message: 'League and all its seasons deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 