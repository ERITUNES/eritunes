const express = require('express');
const router = express.Router();
const Subject = require('../models/Subject');
const { protect } = require('../middleware/auth');

// GET /api/subjects?type=PRIMARY|SECONDARY
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.schoolType = req.query.type;
    const subjects = await Subject.find(filter).sort({ name: 1 });
    res.json({ success: true, subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
