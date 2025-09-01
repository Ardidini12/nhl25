import Player from '../models/player.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';

export const createPlayer = async (req, res, next) => {
  try {
    const { name, position, jerseyNumber } = req.body;

    const playerData = {
      name,
      position,
      jerseyNumber: jerseyNumber || null,
      currentClub: null // Explicitly set to null (free agent) for new players
    };

    const player = await Player.create(playerData);

    res.status(201).json({
      success: true,
      message: 'Player created successfully',
      data: player
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPlayers = async (req, res, next) => {
  try {
    const { clubId } = req.query;
    let query = { isActive: true };
    
    if (clubId) {
      if (clubId === 'no-club') {
        query.currentClub = { $exists: false };
      } else {
        query.currentClub = clubId;
      }
    }

    const players = await Player.find(query)
      .populate('currentClub', 'name')
      .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

export const getPlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const player = await Player.findById(id).populate('currentClub', 'name');
    
    if (!player) {
      const error = new Error('Player not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: player
    });
  } catch (error) {
    next(error);
  }
};

export const updatePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, position, jerseyNumber } = req.body;

    const updateOperation = {
      $set: {
        name,
        position,
        jerseyNumber: jerseyNumber || null
      }
    };

    const player = await Player.findByIdAndUpdate(
      id,
      updateOperation,
      { new: true, runValidators: true }
    );

    if (!player) {
      const error = new Error('Player not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Player updated successfully',
      data: player
    });
  } catch (error) {
    next(error);
  }
};

export const deletePlayer = async (req, res, next) => {
  try {
    const { id } = req.params;

    const player = await Player.findByIdAndDelete(id);

    if (!player) {
      const error = new Error('Player not found');
      error.statusCode = 404;
      throw error;
    }

    // Cascade delete: Remove all season-player associations
    await SeasonPlayer.deleteMany({ player: id });

    res.status(200).json({
      success: true,
      message: 'Player deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 