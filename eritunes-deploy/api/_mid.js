// api/_mid.js  — JWT + CORS middleware
const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'eritunes_secret_2024_change_me';

function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: '30d' });
}

function getUser(req) {
  const h = req.headers['authorization'] || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!t) return null;
  try { return jwt.verify(t, SECRET); } catch { return null; }
}

// Wrap handler with CORS preflight + optional auth
function wrap(handler, { auth = false, admin = false } = {}) {
  return async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Origin',  '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (auth || admin) {
      const user = getUser(req);
      if (!user) return res.status(401).json({ error: 'Not authenticated' });
      if (admin && user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
      req.user = user;
    }

    try {
      return await handler(req, res);
    } catch (err) {
      console.error('[API ERROR]', err.message);
      return res.status(500).json({ error: err.message || 'Server error' });
    }
  };
}

module.exports = { signToken, getUser, wrap };
