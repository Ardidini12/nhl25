import League from '../models/league.model.js';
import Season from '../models/season.model.js';
import SeasonClub from '../models/seasonClub.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';

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
      // Delete all season-club and season-player associations first
      await SeasonClub.deleteMany({ season: { $in: seasonIds } });
      await SeasonPlayer.deleteMany({ season: { $in: seasonIds } });
      
      // Clear season references from clubs and players
      await Club.updateMany(
        { season: { $in: seasonIds } },
        { $unset: { season: 1 } }
      );
      await Player.updateMany(
        { season: { $in: seasonIds } },
        { $unset: { season: 1 }, $set: { currentClub: null } } // Keep currentClub field but set to null
      );
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