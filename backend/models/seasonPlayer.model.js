import mongoose from 'mongoose';

const seasonPlayerSchema = new mongoose.Schema({
  season: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Season',
    required: [true, 'Season reference is required']
  },
  player: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Player',
    required: [true, 'Player reference is required']
  },
  isAssigned: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to ensure unique season-player combinations
seasonPlayerSchema.index({ season: 1, player: 1 }, { unique: true });

const SeasonPlayer = mongoose.model('SeasonPlayer', seasonPlayerSchema);

export default SeasonPlayer; 