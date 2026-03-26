require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./db');

// Import models
const User = require('../models/User');
const Subject = require('../models/Subject');

const PRIMARY_SUBJECTS = [
  { name: 'SST', code: 'SST', schoolType: 'PRIMARY' },
  { name: 'Science', code: 'SCI', schoolType: 'PRIMARY' },
  { name: 'English', code: 'ENG', schoolType: 'PRIMARY' },
  { name: 'Mathematics', code: 'MTH', schoolType: 'PRIMARY' },
];

const SECONDARY_SUBJECTS = [
  { name: 'Mathematics', code: 'MTH', schoolType: 'SECONDARY' },
  { name: 'English', code: 'ENG', schoolType: 'SECONDARY' },
  { name: 'Biology', code: 'BIO', schoolType: 'SECONDARY' },
  { name: 'Chemistry', code: 'CHM', schoolType: 'SECONDARY' },
  { name: 'Physics', code: 'PHY', schoolType: 'SECONDARY' },
  { name: 'History', code: 'HIS', schoolType: 'SECONDARY' },
  { name: 'Geography', code: 'GEO', schoolType: 'SECONDARY' },
  { name: 'CRE', code: 'CRE', schoolType: 'SECONDARY' },
  { name: 'IRE', code: 'IRE', schoolType: 'SECONDARY' },
  { name: 'Computer', code: 'ICT', schoolType: 'SECONDARY' },
  { name: 'Agriculture', code: 'AGR', schoolType: 'SECONDARY' },
  { name: 'Business', code: 'BSN', schoolType: 'SECONDARY' },
  { name: 'Fine Art', code: 'ART', schoolType: 'SECONDARY' },
  { name: 'Music', code: 'MUS', schoolType: 'SECONDARY' },
  { name: 'Literature', code: 'LIT', schoolType: 'SECONDARY' },
  { name: 'French', code: 'FRN', schoolType: 'SECONDARY' },
  { name: 'German', code: 'GER', schoolType: 'SECONDARY' },
];

const seed = async () => {
  await connectDB();

  // Clear existing
  await User.deleteMany({ role: 'ADMIN' });
  await Subject.deleteMany({});

  // Create admin
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('admin123', salt);

  await User.create({
    name: 'System Administrator',
    email: 'admin@sms.com',
    password: hashedPassword,
    role: 'ADMIN',
  });

  // Create subjects
  await Subject.insertMany([...PRIMARY_SUBJECTS, ...SECONDARY_SUBJECTS]);

  console.log('✅ Seed complete!');
  console.log('👤 Admin: admin@sms.com / admin123');
  process.exit(0);
};

seed();
