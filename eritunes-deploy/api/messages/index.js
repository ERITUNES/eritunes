// GET /api/messages — list my conversations
const { getDB, convKey } = require('../_db');
const { wrap }           = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const me  = req.user.username;
  const db  = await getDB();
  const all = await db.collection('messages').find({ participants: me }).toArray();
  const result = all.map(c => {
    const other  = (c.participants || []).find(p => p !== me) || '';
    const msgs   = c.messages || [];
    const unread = msgs.filter(m => m.to === me && !m.read).length;
    const last   = msgs[msgs.length - 1] || null;
    return { key: c.key, otherUser: other, unread, last };
  });
  return res.json(result);
}, { auth: true });
