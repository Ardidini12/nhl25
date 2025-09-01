import SeasonClub from '../models/seasonClub.model.js';
import SeasonPlayer from '../models/seasonPlayer.model.js';
import Club from '../models/club.model.js';
import Player from '../models/player.model.js';

// Create club and add to season in one operation
export const createClubAndAddToSeason = async (req, res, next) => {
  try {
    const { name, webUrl, description, seasonId } = req.body;

    // Create the club with season association
    const club = await Club.create({
      name,
      webUrl,
      description,
      season: seasonId
    });

    // Add club to the specified season (check for duplicates)
    let seasonClub;
    try {
      seasonClub = await SeasonClub.create({
        season: seasonId,
        club: club._id
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - club already in season
        seasonClub = await SeasonClub.findOne({
          season: seasonId,
          club: club._id
        });
      } else {
        throw error;
      }
    }

    const populatedClub = await Club.findById(club._id);
    const populatedSeasonClub = await SeasonClub.findById(seasonClub._id)
      .populate('season', 'name')
      .populate('club', 'name webUrl description');

    res.status(201).json({
      success: true,
      message: 'Club created and added to season successfully',
      data: {
        club: populatedClub,
        seasonAssociation: populatedSeasonClub
      }
    });
  } catch (error) {
    next(error);
  }
};

// Create player and add to season in one operation
export const createPlayerAndAddToSeason = async (req, res, next) => {
  try {
    const { name, position, jerseyNumber, seasonId } = req.body;

    // Create the player with season association
    const playerData = {
      name,
      position,
      jerseyNumber: jerseyNumber || null,
      season: seasonId,
      currentClub: null // Explicitly set to null (free agent) for new players
    };

    const player = await Player.create(playerData);

    // Add player to the specified season (check for duplicates)
    let seasonPlayer;
    try {
      seasonPlayer = await SeasonPlayer.create({
        season: seasonId,
        player: player._id
      });
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate key error - player already in season
        seasonPlayer = await SeasonPlayer.findOne({
          season: seasonId,
          player: player._id
        });
      } else {
        throw error;
      }
    }

    const populatedSeasonPlayer = await SeasonPlayer.findById(seasonPlayer._id)
      .populate('season', 'name')
      .populate('player', 'name position jerseyNumber');

    res.status(201).json({
      success: true,
      message: 'Player created and added to season successfully',
      data: {
        player: player,
        seasonAssociation: populatedSeasonPlayer
      }
    });
  } catch (error) {
    next(error);
  }
};

// Season-Club Management
export const addClubToSeason = async (req, res, next) => {
  try {
    const { seasonId, clubId } = req.body;

    // Check if club is already in season
    const existingSeasonClub = await SeasonClub.findOne({
      season: seasonId,
      club: clubId
    });

    if (existingSeasonClub) {
      return res.status(400).json({
        success: false,
        message: 'Club is already in this season'
      });
    }

    const seasonClub = await SeasonClub.create({
      season: seasonId,
      club: clubId
    });

    const populatedSeasonClub = await SeasonClub.findById(seasonClub._id)
      .populate('season', 'name')
      .populate('club', 'name');

    res.status(201).json({
      success: true,
      message: 'Club added to season successfully',
      data: populatedSeasonClub
    });
  } catch (error) {
    next(error);
  }
};

export const removeClubFromSeason = async (req, res, next) => {
  try {
    const { seasonId, clubId } = req.params;

    const seasonClub = await SeasonClub.findOneAndDelete({
      season: seasonId,
      club: clubId
    });

    // If club wasn't found in season, it might already be removed
    // Return success anyway to avoid frontend errors
    res.status(200).json({
      success: true,
      message: seasonClub ? 'Club removed from season successfully' : 'Club was already removed from season'
    });
  } catch (error) {
    next(error);
  }
};

export const getSeasonClubs = async (req, res, next) => {
  try {
    const { seasonId } = req.params;
    const { assigned } = req.query; // Filter by assignment status

    let query = { season: seasonId };
    if (assigned !== undefined) {
      query.isAssigned = assigned === 'true';
    }

    const seasonClubs = await SeasonClub.find(query)
      .populate('club', 'name webUrl description')
      .sort({ 'club.name': 1 });

    const clubs = seasonClubs
      .filter(sc => sc.club) // Filter out entries where club is null
      .map(sc => ({
        ...sc.club.toObject(),
        isAssigned: sc.isAssigned,
        seasonClubId: sc._id
      }));

    res.status(200).json({
      success: true,
      data: clubs
    });
  } catch (error) {
    next(error);
  }
};

// Season-Player Management
export const addPlayerToSeason = async (req, res, next) => {
  try {
    const { seasonId, playerId } = req.body;

    // Check if player is already in season
    const existingSeasonPlayer = await SeasonPlayer.findOne({
      season: seasonId,
      player: playerId
    });

    if (existingSeasonPlayer) {
      return res.status(400).json({
        success: false,
        message: 'Player is already in this season'
      });
    }

    const seasonPlayer = await SeasonPlayer.create({
      season: seasonId,
      player: playerId
    });

    const populatedSeasonPlayer = await SeasonPlayer.findById(seasonPlayer._id)
      .populate('season', 'name')
      .populate('player', 'name position jerseyNumber currentClub')
      .populate('player.currentClub', 'name');

    res.status(201).json({
      success: true,
      message: 'Player added to season successfully',
      data: populatedSeasonPlayer
    });
  } catch (error) {
    next(error);
  }
};

export const removePlayerFromSeason = async (req, res, next) => {
  try {
    const { seasonId, playerId } = req.params;

    const seasonPlayer = await SeasonPlayer.findOneAndDelete({
      season: seasonId,
      player: playerId
    });

    if (!seasonPlayer) {
      const error = new Error('Player not found in season');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Player removed from season successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const getSeasonPlayers = async (req, res, next) => {
  try {
    const { seasonId } = req.params;
    const { assigned } = req.query; // Filter by assignment status

    let query = { season: seasonId };
    if (assigned !== undefined) {
      query.isAssigned = assigned === 'true';
    }

    const seasonPlayers = await SeasonPlayer.find(query)
      .populate('player', 'name position jerseyNumber currentClub')
      .populate('player.currentClub', 'name')
      .sort({ 'player.name': 1 });

    const players = seasonPlayers
      .filter(sp => sp.player) // Filter out entries where player is null
      .map(sp => {
        const playerData = sp.player.toObject();
        // Ensure currentClub is always present (null for free agents)
        if (playerData.currentClub === undefined) {
          playerData.currentClub = null;
        }
        return {
          ...playerData,
          isAssigned: sp.isAssigned,
          seasonPlayerId: sp._id
        };
      });

    res.status(200).json({
      success: true,
      data: players
    });
  } catch (error) {
    next(error);
  }
};

// Get available clubs/players for a season (not yet added)
export const getAvailableClubsForSeason = async (req, res, next) => {
  try {
    const { seasonId } = req.params;

    // Get clubs already in the season
    const seasonClubs = await SeasonClub.find({ season: seasonId });
    const addedClubIds = seasonClubs.map(sc => sc.club);

    // Get all active clubs created within this season that are not already assigned
    const availableClubs = await Club.find({
      _id: { $nin: addedClubIds },
      season: seasonId,
      isActive: true
    }).sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: availableClubs
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailablePlayersForSeason = async (req, res, next) => {
  try {
    const { seasonId } = req.params;

    // Get players already in the season
    const seasonPlayers = await SeasonPlayer.find({ season: seasonId });
    const addedPlayerIds = seasonPlayers.map(sp => sp.player);

    // Get all active players created within this season that are not already assigned
    const availablePlayers = await Player.find({
      _id: { $nin: addedPlayerIds },
      season: seasonId,
      isActive: true
    })
    .populate('currentClub', 'name')
    .sort({ name: 1 });

    res.status(200).json({
      success: true,
      data: availablePlayers
    });
  } catch (error) {
    next(error);
  }
};

// Update club assignment status in season
export const updateClubAssignment = async (req, res, next) => {
  try {
    const { seasonId, clubId } = req.params;
    const { isAssigned } = req.body;

    const seasonClub = await SeasonClub.findOneAndUpdate(
      { season: seasonId, club: clubId },
      { isAssigned },
      { new: true }
    ).populate('club', 'name webUrl description');

    if (!seasonClub || !seasonClub.club) {
      const error = new Error('Club not found in season');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Club assignment status updated successfully',
      data: {
        ...seasonClub.club.toObject(),
        isAssigned: seasonClub.isAssigned,
        seasonClubId: seasonClub._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update player assignment status in season
export const updatePlayerAssignment = async (req, res, next) => {
  try {
    const { seasonId, playerId } = req.params;
    const { isAssigned } = req.body;

    const seasonPlayer = await SeasonPlayer.findOneAndUpdate(
      { season: seasonId, player: playerId },
      { isAssigned },
      { new: true }
    )
    .populate('player', 'name position jerseyNumber currentClub')
    .populate('player.currentClub', 'name');

    if (!seasonPlayer || !seasonPlayer.player) {
      const error = new Error('Player not found in season');
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: 'Player assignment status updated successfully',
      data: {
        ...seasonPlayer.player.toObject(),
        isAssigned: seasonPlayer.isAssigned,
        seasonPlayerId: seasonPlayer._id
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update player's club assignment (roster management)
export const updatePlayerClubAssignment = async (req, res, next) => {
  try {
    const { playerId } = req.params;
    const { currentClub } = req.body;

    // First check if player exists
    const existingPlayer = await Player.findById(playerId);
    if (!existingPlayer) {
      return res.status(404).json({
        success: false,
        error: 'Player not found'
      });
    }

    let updateOperation;
    
    if (currentClub === 'free-agents' || currentClub === 'no-club' || currentClub === null || !currentClub) {
      updateOperation = {
        $set: { currentClub: null } // Set to null instead of removing field
      };
    } else {
      updateOperation = {
        $set: { currentClub }
      };
    }

    const player = await Player.findByIdAndUpdate(
      playerId,
      updateOperation,
      { new: true, runValidators: true }
    ).populate('currentClub', 'name');

    res.status(200).json({
      success: true,
      message: 'Player club assignment updated successfully',
      data: player
    });
  } catch (error) {
    console.error('Error updating player club assignment:', error);
    next(error);
  }
}; 