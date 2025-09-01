import Club from '../models/club.model.js';
import SeasonClub from '../models/seasonClub.model.js';
import Player from '../models/player.model.js';

export const createClub = async (req, res, next) => {
  try {
    const { name, webUrl, description } = req.body;

    const club = await Club.create({
      name,
      webUrl,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Club created successfully',
      data: club
    });
  } catch (error) {
    next(error);
  }
};

export const getAllClubs = async (req, res, next) => {
  try {
    const clubs = await Club.find({ isActive: true }).sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: clubs
    });
  } catch (error) {
    next(error);
  }
};

export const getClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const club = await Club.findById(id);
    
    if (!club) {
      const error = new Error('Club not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: club
    });
  } catch (error) {
    next(error);
  }
};

export const updateClub = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, webUrl, description, isActive } = req.body;

    const club = await Club.findByIdAndUpdate(
      id,
      { name, webUrl, description, isActive },
      { new: true, runValidators: true }
    );

    if (!club) {
      const error = new Error('Club not found');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Club updated successfully',
      data: club
    });
  } catch (error) {
    next(error);
  }
};

export const deleteClub = async (req, res, next) => {
  try {
    const { id } = req.params;

    const club = await Club.findByIdAndDelete(id);

    if (!club) {
      const error = new Error('Club not found');
      error.statusCode = 404;
      throw error;
    }

    // Cascade delete: Remove all season-club associations and clear player club assignments
    await SeasonClub.deleteMany({ club: id });
    await Player.updateMany(
      { currentClub: id },
      { $set: { currentClub: null } } // Set to null instead of removing field
    );

    res.status(200).json({
      success: true,
      message: 'Club deleted successfully'
    });
  } catch (error) {
    next(error);
  }
}; 