// /api/songs/:id  — GET | DELETE | POST?action=stream|like|comment
const { v4: uuid } = require('uuid');
const { getDB }    = require('../_db');
const { wrap }     = require('../_mid');

module.exports = wrap(async (req, res) => {
  const id    = req.query.id;
  const action = req.query.action || null;
  const db    = await getDB();
  const songs = db.collection('songs');

  if (req.method === 'GET') {
    const s = await songs.findOne({ id });
    if (!s) return res.status(404).json({ error: 'Song not found' });
    const { _id, ...safe } = s;
    return res.json(safe);
  }

  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    await songs.deleteOne({ id });
    return res.json({ message: 'Song deleted' });
  }

  if (req.method === 'PATCH') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const upd = {};
    ['title','genre','artists','album'].forEach(k => { if (req.body[k] !== undefined) upd[k] = req.body[k]; });
    await songs.updateOne({ id }, { $set: upd });
    const s = await songs.findOne({ id });
    const { _id, ...safe } = s;
    return res.json(safe);
  }

  if (req.method === 'POST') {
    if (action === 'stream') {
      await songs.updateOne({ id }, { $inc: { streams: 1 } });
      const s = await songs.findOne({ id });
      return res.json({ streams: s.streams });
    }

    if (action === 'like') {
      const s = await songs.findOne({ id });
      if (!s) return res.status(404).json({ error: 'Not found' });
      const liked = (s.likes || []).includes(req.user.username);
      if (liked) {
        await songs.updateOne({ id }, { $pull:    { likes: req.user.username } });
        return res.json({ liked: false, count: (s.likes||[]).length - 1 });
      } else {
        await songs.updateOne({ id }, { $addToSet: { likes: req.user.username } });
        return res.json({ liked: true,  count: (s.likes||[]).length + 1 });
      }
    }

    if (action === 'comment') {
      const text = (req.body?.text || '').trim();
      if (!text) return res.status(400).json({ error: 'Comment empty' });
      const cmt = {
        id:       uuid(),
        username: req.user.username,
        text,
        at:       new Date().toLocaleString(),
      };
      await songs.updateOne({ id }, { $push: { comments: cmt } });
      return res.status(201).json(cmt);
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true });
