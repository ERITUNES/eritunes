// POST /api/auth/login
const bcrypt        = require('bcryptjs');
const { getDB, safe } = require('../_db');
const { signToken, wrap } = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { identifier, password } = req.body || {};
  if (!identifier || !password) return res.status(400).json({ error: 'All fields required' });

  // Hardcoded admin fast-path
  if (identifier === 'Ericfx' && password === '5qejifyd') {
    const db = await getDB();
    const u  = await db.collection('users').findOne({ username: 'Ericfx' });
    if (u) {
      await db.collection('users').updateOne({ username: 'Ericfx' }, { $set: { lastSeen: Date.now() } });
      const token = signToken({ id: u.id, username: u.username, role: 'admin' });
      return res.json({ token, user: safe(u) });
    }
  }

  const db = await getDB();
  const u  = await db.collection('users').findOne({
    $or: [
      { username: identifier.trim() },
      { email:    identifier.trim().toLowerCase() }
    ]
  });

  if (!u) return res.status(401).json({ error: 'Account not found.' });

  const ok = u.pass ? bcrypt.compareSync(password, u.pass) : false;
  if (!ok) return res.status(401).json({ error: 'Incorrect password.' });

  if (!u.accountApproved) return res.status(403).json({ error: 'pending', message: '⏳ Account pending admin approval.' });

  await db.collection('users').updateOne({ username: u.username }, { $set: { lastSeen: Date.now() } });
  const token = signToken({ id: u.id, username: u.username, role: u.admin ? 'admin' : 'user' });
  return res.json({ token, user: safe(u) });
});
