const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Student name is required'],
    trim: true,
  },
  studentId: {
    type: String,
    unique: true,
  },
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
  },
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School',
    required: true,
  },
  subjects: [{
    type: String,
  }],
  gender: {
    type: String,
    enum: ['MALE', 'FEMALE', 'OTHER'],
    default: 'MALE',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

studentSchema.pre('save', async function (next) {
  if (!this.studentId) {
    const rand = Math.floor(10000 + Math.random() * 90000);
    this.studentId = `STU-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Student', studentSchema);
