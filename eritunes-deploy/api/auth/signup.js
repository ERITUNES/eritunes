// POST /api/auth/signup
const bcrypt       = require('bcryptjs');
const { v4: uuid } = require('uuid');
const { getDB }    = require('../_db');
const { wrap }     = require('../_mid');

module.exports = wrap(async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    username, password, displayName, email, phone,
    dob, gender, location, bio, website, avatar, inviteCode
  } = req.body || {};

  if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
  if (username === 'Ericfx')  return res.status(400).json({ error: 'Reserved username' });

  const db    = await getDB();
  const users = db.collection('users');

  if (await users.findOne({ username: username.trim() }))
    return res.status(409).json({ error: 'Username already taken' });

  if (email && await users.findOne({ email: email.trim().toLowerCase() }))
    return res.status(409).json({ error: 'Email already registered' });

  // Age gate
  if (dob) {
    const age = (Date.now() - new Date(dob)) / (1000*60*60*24*365.25);
    if (age < 13) return res.status(400).json({ error: 'Must be at least 13 years old' });
  }

  // Invite code validation
  const code = (inviteCode || '').trim().toUpperCase();
  let invitedBy = null;
  if (code) {
    const inv = await db.collection('invites').findOne({ code });
    if (!inv)         return res.status(400).json({ error: 'Invalid invite code' });
    if (!inv.active)  return res.status(400).json({ error: 'Invite code deactivated' });
    if (inv.usedBy)   return res.status(400).json({ error: 'Invite code already used' });
    invitedBy = inv.createdBy;
    await db.collection('invites').updateOne({ code }, {
      $set: { usedBy: username.trim(), usedAt: new Date().toLocaleDateString('en-GB', { month:'short', day:'numeric', year:'numeric' }) }
    });
  }

  const newUser = {
    id:              uuid(),
    username:        username.trim(),
    email:           email ? email.trim().toLowerCase() : '',
    pass:            bcrypt.hashSync(password, 10),
    displayName:     (displayName || '').trim() || username.trim(),
    phone:           phone    || '',
    dob:             dob      || '',
    gender:          gender   || '',
    location:        location || '',
    bio:             bio      || '',
    website:         website  || '',
    avatar:          avatar   || null,
    role:            'user',
    admin:           false,
    artist:          false,
    verified:        false,
    blueTick:        false,
    developerBadge:  false,
    accountApproved: false,
    followers:       [],
    following:       [],
    invitedBy,
    inviteCode:      code || null,
    joinDate:        new Date().toLocaleDateString('en-GB', { month:'short', year:'numeric' }),
    createdAt:       new Date().toISOString(),
    lastSeen:        0,
  };

  await users.insertOne(newUser);
  return res.status(201).json({ message: 'Account created — awaiting admin approval' });
});
