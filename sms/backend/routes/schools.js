const express = require('express');
const router = express.Router();
const School = require('../models/School');
const { protect, authorize } = require('../middleware/auth');

// GET /api/schools — Admin: all; others: own school
router.get('/', protect, async (req, res) => {
  try {
    let schools;
    if (req.user.role === 'ADMIN') {
      schools = await School.find().sort({ createdAt: -1 });
    } else {
      schools = await School.find({ _id: req.user.school });
    }
    res.json({ success: true, schools });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/schools — Admin only
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, type, location } = req.body;
    if (!name || !type)
      return res.status(400).json({ success: false, message: 'Name and type required' });

    const school = await School.create({ name, type, location });
    res.status(201).json({ success: true, school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/schools/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const school = await School.findById(req.params.id);
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });

    // Access control
    if (req.user.role !== 'ADMIN' && req.user.school?._id?.toString() !== req.params.id)
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/schools/:id — Admin only
router.put('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!school) return res.status(404).json({ success: false, message: 'School not found' });
    res.json({ success: true, school });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/schools/:id — Admin only
router.delete('/:id', protect, authorize('ADMIN'), async (req, res) => {
  try {
    await School.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'School deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
