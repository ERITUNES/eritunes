const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password').populate('school');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive)
      return res.status(403).json({ success: false, message: 'Account is deactivated' });

    const token = signToken(user._id);
    const { password: _, ...userData } = user.toObject();

    res.json({ success: true, token, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('school');
  res.json({ success: true, user });
});

// POST /api/auth/register (Admin only — creates DOS/HM/TEACHER accounts)
router.post('/register', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, email, password, role, school, subjects } = req.body;

    if (!['DOS', 'HM', 'TEACHER'].includes(role))
      return res.status(400).json({ success: false, message: 'Invalid role' });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role, school, subjects: subjects || [] });
    await user.populate('school');

    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/users (Admin only)
router.get('/users', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'ADMIN' } }).populate('school').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/users/school/:schoolId (school-level staff)
router.get('/users/school/:schoolId', protect, async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    // Admins can see any, DOS/HM can only see their school
    if (req.user.role !== 'ADMIN' && req.user.school?._id?.toString() !== schoolId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    const users = await User.find({ school: schoolId, role: 'TEACHER' }).populate('school');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/auth/users/:id (Admin only)
router.delete('/users/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
