// GET /api/users — list users (admin only)
const { getDB, safe } = require('../_db');
const { wrap }        = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const db    = await getDB();
  const q     = (req.query.q || '').toLowerCase().trim();
  let users   = await db.collection('users').find({}).toArray();

  if (q) users = users.filter(u =>
    (u.username||'').toLowerCase().includes(q) ||
    (u.displayName||'').toLowerCase().includes(q) ||
    (u.email||'').toLowerCase().includes(q)
  );

  return res.json(users.map(safe));
}, { auth: true, admin: false });  // auth required but list is also used by non-admins for search
