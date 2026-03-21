// GET /api/songs  |  POST /api/songs
const { v4: uuid } = require('uuid');
const { getDB }    = require('../_db');
const { wrap }     = require('../_mid');

module.exports = wrap(async (req, res) => {
  const db    = await getDB();
  const songs = db.collection('songs');

  // ── GET — list songs ─────────────────────────────
  if (req.method === 'GET') {
    const { genre, artist, q, sort } = req.query;
    let filter = {};
    if (genre)  filter.genre   = genre;
    if (artist) filter.artists = artist;
    if (q) filter.$or = [
      { title:   { $regex: q, $options: 'i' } },
      { artists: { $elemMatch: { $regex: q, $options: 'i' } } },
      { genre:   { $regex: q, $options: 'i' } },
    ];
    let list = await songs.find(filter).toArray();
    list = list.map(({ _id, ...s }) => s);
    if (sort === 'streams') list.sort((a,b)=>(b.streams||0)-(a.streams||0));
    else if (sort === 'likes') list.sort((a,b)=>(b.likes||0)-(a.likes||0));
    else list.sort((a,b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    return res.json(list);
  }

  // ── POST — upload song (admin only) ─────────────
  if (req.method === 'POST') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { title, genre, artists, audioType, audioSrc, coverUrl, coverB64, album } = req.body || {};
    if (!title) return res.status(400).json({ error: 'Title required' });

    const song = {
      id:          uuid(),
      title:       title.trim(),
      genre:       genre || '',
      album:       album || '',
      artists:     Array.isArray(artists) ? artists : (artists ? [artists] : []),
      audioType:   audioType || 'url',
      audioSrc:    audioSrc  || '',
      cover:       coverB64  || coverUrl || null,
      uploadDate:  new Date().toISOString(),
      uploadedBy:  req.user.username,
      streams:     0,
      likes:       [],
      comments:    [],
    };
    await songs.insertOne(song);
    const { _id, ...safe } = song;
    return res.status(201).json(safe);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true });
