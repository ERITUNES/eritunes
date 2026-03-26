const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  score: {
    type: String,
    enum: ['A', 'B', 'C', 'D', 'E'],
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  term: {
    type: String,
    default: 'Term 1',
  },
  year: {
    type: Number,
    default: new Date().getFullYear(),
  },
  remarks: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Unique mark per student+subject+term+year
markSchema.index({ student: 1, subject: 1, term: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Mark', markSchema);
