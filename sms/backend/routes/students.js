const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const { protect, authorize, requireSchool } = require('../middleware/auth');

// Resolve schoolId from user context
const getSchoolId = (req) => {
  if (req.user.role === 'ADMIN') return req.query.schoolId || null;
  return req.user.school?._id?.toString();
};

// GET /api/students
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    const schoolId = getSchoolId(req);
    if (schoolId) filter.school = schoolId;

    if (req.query.class) filter.class = req.query.class;

    const students = await Student.find(filter).populate('school', 'name type schoolNumber').sort({ name: 1 });
    res.json({ success: true, students, count: students.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/students
router.post('/', protect, authorize('ADMIN', 'DOS', 'HM'), async (req, res) => {
  try {
    const { name, class: cls, school, subjects, gender } = req.body;
    const schoolId = req.user.role === 'ADMIN' ? school : req.user.school?._id;

    if (!name || !cls || !schoolId)
      return res.status(400).json({ success: false, message: 'Name, class, and school required' });

    const student = await Student.create({ name, class: cls, school: schoolId, subjects: subjects || [], gender });
    await student.populate('school', 'name type schoolNumber');
    res.status(201).json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('school');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

    // Access control
    const schoolId = getSchoolId(req);
    if (schoolId && student.school._id.toString() !== schoolId)
      return res.status(403).json({ success: false, message: 'Access denied' });

    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/students/:id
router.put('/:id', protect, authorize('ADMIN', 'DOS', 'HM'), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true }).populate('school');
    if (!student) return res.status(404).json({ success: false, message: 'Student not found' });
    res.json({ success: true, student });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/students/:id
router.delete('/:id', protect, authorize('ADMIN', 'DOS', 'HM'), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/students/classes/:schoolId — get distinct classes
router.get('/classes/:schoolId', protect, async (req, res) => {
  try {
    const classes = await Student.distinct('class', { school: req.params.schoolId });
    res.json({ success: true, classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
