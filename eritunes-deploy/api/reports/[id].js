// PATCH /api/reports/:id?action=read | DELETE /api/reports/:id
const { getDB } = require('../_db');
const { wrap }  = require('../_mid');

module.exports = wrap(async (req, res) => {
  const id  = req.query.id;
  const db  = await getDB();
  const col = db.collection('reports');

  if (req.method === 'PATCH') {
    await col.updateOne({ id }, { $set: { read: true } });
    return res.json({ message: 'Marked as read' });
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ id });
    return res.json({ message: 'Dismissed' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true, admin: true });
