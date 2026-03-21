// GET /api/songs/charts — top 20 by streams
const { getDB } = require('../_db');
const { wrap }  = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const db   = await getDB();
  const list = await db.collection('songs').find({}).toArray();
  const top  = list
    .map(({ _id, ...s }) => s)
    .sort((a, b) => (b.streams||0) - (a.streams||0))
    .slice(0, 20);
  return res.json(top);
}, { auth: true });
