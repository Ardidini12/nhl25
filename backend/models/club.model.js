import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Club name is required'],
    trim: true,
    minLength: 2,
    maxLength: 100,
  },
  webUrl: {
    type: String,
    trim: true,
    maxLength: 500,
  },
  description: {
    type: String,
    trim: true,
    maxLength: 500,
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

const Club = mongoose.model('Club', clubSchema);

export default Club; 