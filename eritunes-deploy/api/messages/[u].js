// /api/messages/:u  — GET | POST | DELETE
const { v4: uuid }       = require('uuid');
const { getDB, convKey } = require('../_db');
const { wrap }           = require('../_mid');

module.exports = wrap(async (req, res) => {
  const toUser = req.query.u;
  const me     = req.user.username;
  const key    = convKey(me, toUser);
  const db     = await getDB();
  const col    = db.collection('messages');

  if (req.method === 'GET') {
    const convo = await col.findOne({ key });
    if (!convo) return res.json([]);
    const updated = (convo.messages || []).map(m =>
      m.to === me && !m.read ? { ...m, read: true } : m
    );
    await col.updateOne({ key }, { $set: { messages: updated } });
    return res.json(updated);
  }

  if (req.method === 'POST') {
    const text = (req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Empty message' });
    const msg = { id: uuid(), from: me, to: toUser, text, at: new Date().toLocaleString(), read: false };
    await col.updateOne(
      { key },
      { $push: { messages: msg }, $setOnInsert: { key, participants: [me, toUser] } },
      { upsert: true }
    );
    return res.status(201).json(msg);
  }

  if (req.method === 'DELETE') {
    await col.deleteOne({ key });
    return res.json({ message: 'Cleared' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true });
