import mongoose from 'mongoose';

const seasonClubSchema = new mongoose.Schema({
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: [true, 'Season reference is required']
  },
  club: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: [true, 'Club reference is required']
  },
  isAssigned: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to ensure unique season-club combinations
seasonClubSchema.index({ season: 1, club: 1 }, { unique: true });

const SeasonClub = mongoose.model('SeasonClub', seasonClubSchema);

export default SeasonClub; 