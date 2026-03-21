// PATCH /api/invites/:code?action=deactivate|reactivate  |  DELETE
const { getDB } = require('../_db');
const { wrap }  = require('../_mid');

module.exports = wrap(async (req, res) => {
  const code   = req.query.code;
  const action = req.query.action;
  const db     = await getDB();
  const col    = db.collection('invites');

  if (req.method === 'PATCH') {
    if (action === 'deactivate') { await col.updateOne({ code }, { $set: { active: false } }); return res.json({ message: 'Deactivated' }); }
    if (action === 'reactivate') { await col.updateOne({ code }, { $set: { active: true  } }); return res.json({ message: 'Reactivated' }); }
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ code });
    return res.json({ message: 'Deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true, admin: true });
