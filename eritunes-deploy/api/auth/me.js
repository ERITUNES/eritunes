// GET /api/auth/me
const { getDB, safe } = require('../_db');
const { wrap }        = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db = await getDB();
  const u  = await db.collection('users').findOne({ username: req.user.username });
  if (!u) return res.status(404).json({ error: 'User not found' });
  await db.collection('users').updateOne({ username: req.user.username }, { $set: { lastSeen: Date.now() } });
  return res.json({ user: safe(u) });
}, { auth: true });
