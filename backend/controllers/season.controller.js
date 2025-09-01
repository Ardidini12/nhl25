import Season from '../models/season.model.js';
import SeasonClub from '../models/seasonClub.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';
import Club from '../models/club.model.js';
import Player from '../models/player.model.js';

export const createSeason = async (req, res, next) => {
  try {
    const { league, name, startDate, endDate, description } = req.body;

    const season = await Season.create({
      league,
      name,
      startDate,
      endDate,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Season created successfully',
      data: season
    });
  } catch (error) {
    next(error);
  }
};

export const getAllSeasons = async (req, res, next) => {
  try {
    const { leagueId } = req.query;
    let query = {}; // Remove isActive filter to show all seasons
    
    if (leagueId) {
      query.league = leagueId;
    }

    const seasons = await Season.find(query)
      .populate('league', 'name')
      .sort({ startDate: -1 });
    
    res.status(200).json({
      success: true,
      data: seasons
    });
  } catch (error) {
    next(error);
  }
};

export const getSeason = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const season = await Season.findById(id).populate('league', 'name');
    
    if (!season) {
      const error = new Error('Season not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: season
    });
  } catch (error) {
    next(error);
  }
};

export const updateSeason = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, startDate, endDate, description, isActive } = req.body;

    const season = await Season.findByIdAndUpdate(
      id,
      { name, startDate, endDate, description, isActive },
      { new: true, runValidators: true }
    );

    if (!season) {
      const error = new Error('Season not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Season updated successfully',
      data: season
    });
  } catch (error) {
    next(error);
  }
};

export const deleteSeason = async (req, res, next) => {
  try {
    const { id } = req.params;

    const season = await Season.findByIdAndDelete(id);

    if (!season) {
      const error = new Error('Season not found');
      error.statusCode = 404;
      throw error;
    }

    // Get all clubs and players associated with this season
    const seasonClubs = await SeasonClub.find({ season: id });
    const seasonPlayers = await SeasonPlayer.find({ season: id });
    
    const clubIds = seasonClubs.map(sc => sc.club);
    const playerIds = seasonPlayers.map(sp => sp.player);

    // Delete all season-club and season-player associations first
    await SeasonClub.deleteMany({ season: id });
    await SeasonPlayer.deleteMany({ season: id });
    
    // For each club, check if it exists in other seasons
    for (const clubId of clubIds) {
      const otherSeasonClubs = await SeasonClub.findOne({ 
        club: clubId, 
        season: { $ne: id } 
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
        season: { $ne: id } 
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

    res.status(200).json({
      success: true,
      message: 'Season and all its associations deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 