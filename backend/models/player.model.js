import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
  position: {
    type: String,
    required: [true, 'Player position is required'],
    trim: true,
    maxLength: 50,
  },
  jerseyNumber: {
    type: Number,
    min: 0,
    max: 99,
  },
  currentClub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: false, // Made optional to allow players without clubs
    default: null // Default to null (free agent) for new players
  },
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: false // Optional for backward compatibility
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const Player = mongoose.model('Player', playerSchema);

export default Player; 