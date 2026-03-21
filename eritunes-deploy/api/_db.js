// api/_db.js  — shared MongoDB connection (cached across warm invocations)
const { MongoClient } = require('mongodb');

const URI = process.env.MONGODB_URI;
if (!URI) throw new Error('MONGODB_URI environment variable not set');

let _client, _db;

async function getDB() {
  if (_db) return _db;
  if (!_client) {
    _client = new MongoClient(URI, { maxPoolSize: 5 });
    await _client.connect();
  }
  _db = _client.db('eritunes');

  // ── Seed admin on very first run ──────────────────
  const bcrypt = require('bcryptjs');
  const users  = _db.collection('users');
  const exists = await users.findOne({ username: 'Ericfx' });
  if (!exists) {
    await users.insertOne({
      id:              'admin_ericfx',
      username:        'Ericfx',
      email:           'admin@eritunes.com',
      pass:            bcrypt.hashSync('5qejifyd', 10),
      displayName:     'Xavier Eric',
      role:            'admin',
      admin:           true,
      artist:          true,
      verified:        true,
      blueTick:        true,
      developerBadge:  true,
      accountApproved: true,
      bio:             '🎧 Founder & Developer of EriTunes',
      location:        'Worldwide',
      website:         '',
      avatar:          null,
      followers:       [],
      following:       [],
      joinDate:        new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      createdAt:       new Date().toISOString(),
      lastSeen:        Date.now(),
      artistApplication: null,
    });
    console.log('✅ Admin account seeded');
  }

  return _db;
}

function safe(u) {
  if (!u) return null;
  const { pass, _id, ...rest } = u;
  return rest;
}

function convKey(a, b) { return [a, b].sort().join('__'); }

module.exports = { getDB, safe, convKey };
