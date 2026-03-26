const express = require('express');
const router = express.Router();
const Mark = require('../models/Mark');
const Student = require('../models/Student');
const { protect, authorize } = require('../middleware/auth');

const getSchoolId = (req) => {
  if (req.user.role === 'ADMIN') return req.query.schoolId || null;
  return req.user.school?._id?.toString();
};

// GET /api/marks — with filters
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    const schoolId = getSchoolId(req);
    if (schoolId) filter.school = schoolId;
    if (req.query.subject) filter.subject = req.query.subject;
    if (req.query.student) filter.student = req.query.student;
    if (req.query.term) filter.term = req.query.term;
    if (req.query.year) filter.year = req.query.year;

    // Teachers only see their own marks
    if (req.user.role === 'TEACHER') filter.teacher = req.user._id;

    const marks = await Mark.find(filter)
      .populate('student', 'name class studentId')
      .populate('teacher', 'name email')
      .populate('school', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, marks, count: marks.length });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/marks — Teacher uploads a mark
router.post('/', protect, authorize('TEACHER', 'DOS', 'HM', 'ADMIN'), async (req, res) => {
  try {
    const { student, subject, score, term, year, remarks } = req.body;
    const schoolId = req.user.role === 'ADMIN' ? req.body.school : req.user.school?._id;

    // Teachers can only upload for assigned subjects
    if (req.user.role === 'TEACHER' && !req.user.subjects.includes(subject)) {
      return res.status(403).json({ success: false, message: `You are not assigned to teach ${subject}` });
    }

    // Check student belongs to same school
    const studentDoc = await Student.findById(student);
    if (!studentDoc) return res.status(404).json({ success: false, message: 'Student not found' });

    if (req.user.role !== 'ADMIN' && studentDoc.school.toString() !== schoolId?.toString())
      return res.status(403).json({ success: false, message: 'Student not in your school' });

    // Upsert mark
    const mark = await Mark.findOneAndUpdate(
      { student, subject, term: term || 'Term 1', year: year || new Date().getFullYear() },
      { score, teacher: req.user._id, school: schoolId, remarks: remarks || '' },
      { new: true, upsert: true, runValidators: true }
    );

    await mark.populate([
      { path: 'student', select: 'name class studentId' },
      { path: 'teacher', select: 'name email' },
    ]);

    res.status(201).json({ success: true, mark });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/marks/:id
router.delete('/:id', protect, authorize('ADMIN', 'DOS', 'HM'), async (req, res) => {
  try {
    await Mark.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Mark deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/marks/analytics — performance summary
router.get('/analytics', protect, async (req, res) => {
  try {
    const schoolId = getSchoolId(req);
    const filter = {};
    if (schoolId) filter.school = schoolId;
    if (req.query.term) filter.term = req.query.term;
    if (req.query.year) filter.year = parseInt(req.query.year);

    const marks = await Mark.find(filter).populate('student', 'name class');

    // Grade distribution
    const gradeCount = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    marks.forEach(m => gradeCount[m.score]++);

    // Per-subject breakdown
    const subjectMap = {};
    marks.forEach(m => {
      if (!subjectMap[m.subject]) subjectMap[m.subject] = { A: 0, B: 0, C: 0, D: 0, E: 0, total: 0 };
      subjectMap[m.subject][m.score]++;
      subjectMap[m.subject].total++;
    });

    // Per-class breakdown
    const classMap = {};
    marks.forEach(m => {
      const cls = m.student?.class || 'Unknown';
      if (!classMap[cls]) classMap[cls] = { A: 0, B: 0, C: 0, D: 0, E: 0, total: 0 };
      classMap[cls][m.score]++;
      classMap[cls].total++;
    });

    const gradeScore = { A: 5, B: 4, C: 3, D: 2, E: 1 };
    const totalScore = marks.reduce((acc, m) => acc + (gradeScore[m.score] || 0), 0);
    const average = marks.length ? (totalScore / marks.length).toFixed(2) : 0;

    res.json({
      success: true,
      analytics: {
        totalMarks: marks.length,
        gradeDistribution: gradeCount,
        subjectBreakdown: subjectMap,
        classBreakdown: classMap,
        averageScore: average,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/marks/student/:studentId — all marks for one student
router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const marks = await Mark.find({ student: req.params.studentId })
      .populate('teacher', 'name')
      .sort({ subject: 1 });
    res.json({ success: true, marks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
