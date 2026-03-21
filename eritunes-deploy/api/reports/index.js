// GET /api/reports (admin) | POST /api/reports (any user)
const { v4: uuid } = require('uuid');
const { getDB }    = require('../_db');
const { wrap }     = require('../_mid');

module.exports = wrap(async (req, res) => {
  const db  = await getDB();
  const col = db.collection('reports');

  if (req.method === 'GET') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const all = await col.find({}).sort({ _id: -1 }).toArray();
    return res.json(all.map(({ _id, ...r }) => r));
  }

  if (req.method === 'POST') {
    const { targetId, targetType, reason, details } = req.body || {};
    if (!targetId || !reason) return res.status(400).json({ error: 'Required fields missing' });
    await col.insertOne({
      id:         uuid(),
      reporter:   req.user.username,
      targetId,
      targetType: targetType || 'user',
      reason,
      details:    details || '',
      at:         new Date().toLocaleString(),
      read:       false,
    });
    return res.status(201).json({ message: 'Report submitted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true });
