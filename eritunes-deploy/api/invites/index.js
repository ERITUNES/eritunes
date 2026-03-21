// GET /api/invites | POST /api/invites (admin)
const { getDB } = require('../_db');
const { wrap }  = require('../_mid');

module.exports = wrap(async (req, res) => {
  const db  = await getDB();
  const col = db.collection('invites');

  if (req.method === 'GET') {
    const all = await col.find({}).toArray();
    return res.json(all.map(({ _id, ...i }) => i));
  }

  if (req.method === 'POST') {
    const qty  = Math.min(parseInt(req.body?.qty) || 1, 20);
    const note = (req.body?.note || '').trim() || null;
    const codes = [];
    for (let i = 0; i < qty; i++) {
      const code = Math.random().toString(36).slice(2, 10).toUpperCase();
      await col.insertOne({
        code, note,
        createdBy: req.user.username,
        createdAt: new Date().toLocaleDateString('en-GB', { month:'short', day:'numeric', year:'numeric' }),
        usedBy:    null,
        usedAt:    null,
        active:    true,
      });
      codes.push(code);
    }
    return res.status(201).json({ codes, message: `${qty} code(s) generated` });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true, admin: true });
