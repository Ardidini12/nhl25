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

    // Cascade delete: Remove all season-club and season-player associations
    await SeasonClub.deleteMany({ season: id });
    await SeasonPlayer.deleteMany({ season: id });
    
    // Clear season references from clubs and players, and reset player club assignments
    await Club.updateMany(
      { season: id },
      { $unset: { season: 1 } }
    );
    await Player.updateMany(
      { season: id },
      { $unset: { season: 1 }, $set: { currentClub: null } } // Keep currentClub field but set to null
    );

    res.status(200).json({
      success: true,
      message: 'Season and all its associations deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 