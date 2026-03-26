const mongoose = require('mongoose');

const schoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['PRIMARY', 'SECONDARY'],
    required: [true, 'School type is required'],
  },
  schoolNumber: {
    type: String,
    unique: true,
  },
  location: {
    type: String,
    trim: true,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

// Auto-generate school number before saving
schoolSchema.pre('save', async function (next) {
  if (!this.schoolNumber) {
    const rand = Math.floor(100000 + Math.random() * 900000);
    this.schoolNumber = `SCH-${rand}`;
  }
  next();
});

module.exports = mongoose.model('School', schoolSchema);
