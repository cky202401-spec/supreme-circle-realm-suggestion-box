// Netlify function: verify ADMIN_PASSWORD (env var) and set HttpOnly cookie with JWT
const jwt = require('jsonwebtoken');

exports.handler = async (event, context) => {
  // allow GET for logout (clears cookie) and POST for login
  if (event.httpMethod === 'GET' && event.queryStringParameters && event.queryStringParameters.logout) {
    return {
      statusCode: 200,
      headers: {
        'Set-Cookie': `admin_token=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ok: true })
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method not allowed' }) };
  }

  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch(_) {}
  const provided = body.password || '';

  const adminPassword = process.env.ADMIN_PASSWORD || '';
  const jwtSecret = process.env.JWT_SECRET || '';

  if (!adminPassword || !jwtSecret) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured' }) };
  }

  // simple time-constant compare
  const safeEqual = (a='', b='') => {
    if (a.length !== b.length) return false;
    let res = 0;
    for (let i=0;i<a.length;i++) res |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return res === 0;
  };

  if (!safeEqual(provided, adminPassword)) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  // create a short-lived token
  const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn: '1h' });

  return {
    statusCode: 200,
    headers: {
      'Set-Cookie': `admin_token=${token}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=3600`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ ok: true })
  };
};
