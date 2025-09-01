import mongoose from 'mongoose';

const leagueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'League name is required'],
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500,
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

const League = mongoose.model('League', leagueSchema);

export default League; 