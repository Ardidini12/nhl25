import mongoose from 'mongoose';

const seasonSchema = new mongoose.Schema({
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'League',
    required: [true, 'League reference is required']
  },
  name: {
    type: String,
    required: [true, 'Season name is required'],
    trim: true,
    minLength: 1,
    maxLength: 50,
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
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

const Season = mongoose.model('Season', seasonSchema);

export default Season; 