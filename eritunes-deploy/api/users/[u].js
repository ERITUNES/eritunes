// /api/users/:u  — GET, PATCH, DELETE + POST?action=...
const bcrypt          = require('bcryptjs');
const { getDB, safe } = require('../_db');
const { wrap }        = require('../_mid');

module.exports = wrap(async (req, res) => {
  const username = req.query.u;
  const action   = req.query.action || null;
  const db       = await getDB();
  const users    = db.collection('users');

  // ── GET ─────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const u = await users.findOne({ username });
    if (!u) return res.status(404).json({ error: 'User not found' });
    return res.json(safe(u));
  }

  // ── PATCH — edit own profile ─────────────────────────────────
  if (req.method === 'PATCH') {
    if (req.user.username !== username && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Forbidden' });
    const allowed = ['displayName','bio','avatar','location','website','phone'];
    const upd = {};
    for (const k of allowed) if (req.body[k] !== undefined) upd[k] = req.body[k];
    await users.updateOne({ username }, { $set: upd });
    const u = await users.findOne({ username });
    return res.json(safe(u));
  }

  // ── DELETE ───────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    if (username === 'Ericfx')    return res.status(403).json({ error: 'Cannot delete admin' });
    await users.deleteOne({ username });
    return res.json({ message: 'User deleted' });
  }

  // ── POST with action ─────────────────────────────────────────
  if (req.method === 'POST') {
    const isAdmin = req.user.role === 'admin';

    // Follow / unfollow
    if (action === 'follow') {
      const me   = await users.findOne({ username: req.user.username });
      const them = await users.findOne({ username });
      if (!me || !them) return res.status(404).json({ error: 'User not found' });
      const already = (me.following || []).includes(username);
      if (already) {
        await users.updateOne({ username: req.user.username }, { $pull: { following: username } });
        await users.updateOne({ username }, { $pull: { followers: req.user.username } });
        return res.json({ following: false });
      } else {
        await users.updateOne({ username: req.user.username }, { $addToSet: { following: username } });
        await users.updateOne({ username }, { $addToSet: { followers: req.user.username } });
        return res.json({ following: true });
      }
    }

    // Artist application
    if (action === 'artist-apply') {
      await users.updateOne({ username }, {
        $set: { artistApplication: 'pending', artistAppData: req.body }
      });
      return res.json({ message: 'Application submitted' });
    }

    // ── Admin-only actions ─────────────────────────────────────
    if (!isAdmin) return res.status(403).json({ error: 'Admin only' });

    if (action === 'approve') {
      await users.updateOne({ username }, { $set: { accountApproved: true } });
      return res.json({ message: 'Approved' });
    }
    if (action === 'reject') {
      await users.updateOne({ username }, { $set: { accountApproved: false, rejected: true } });
      return res.json({ message: 'Rejected' });
    }
    if (action === 'approve-artist') {
      await users.updateOne({ username }, { $set: { artist: true, verified: true, artistApplication: 'approved' } });
      return res.json({ message: 'Artist approved' });
    }
    if (action === 'reject-artist') {
      await users.updateOne({ username }, { $set: { artistApplication: 'rejected' } });
      return res.json({ message: 'Artist rejected' });
    }
    if (action === 'revoke-artist') {
      await users.updateOne({ username }, { $set: { artist: false, artistApplication: null } });
      return res.json({ message: 'Artist revoked' });
    }
    if (action === 'bluetick') {
      const u = await users.findOne({ username });
      const newVal = !(u && u.blueTick);
      await users.updateOne({ username }, { $set: { blueTick: newVal } });
      return res.json({ blueTick: newVal });
    }
    if (action === 'verify') {
      const u = await users.findOne({ username });
      const newVal = !(u && u.verified);
      await users.updateOne({ username }, { $set: { verified: newVal } });
      return res.json({ verified: newVal });
    }
    if (action === 'reveal-password') {
      const admin = await users.findOne({ username: req.user.username });
      if (!bcrypt.compareSync(req.body.adminPassword || '', admin.pass))
        return res.status(401).json({ error: 'Wrong admin password' });
      const target = await users.findOne({ username });
      if (!target) return res.status(404).json({ error: 'Not found' });
      return res.json({ passwordHash: target.pass });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}, { auth: true });
