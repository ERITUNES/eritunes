const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  code: {
    type: String,
    required: true,
    uppercase: true,
  },
  schoolType: {
    type: String,
    enum: ['PRIMARY', 'SECONDARY', 'BOTH'],
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('Subject', subjectSchema);
