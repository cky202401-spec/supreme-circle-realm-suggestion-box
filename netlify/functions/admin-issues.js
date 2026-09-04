// Netlify function: returns issues only for authenticated admins (checks cookie JWT)
// Requires: JWT_SECRET and GH_TOKEN (personal access token) in env
const jwt = require('jsonwebtoken');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const jwtSecret = process.env.JWT_SECRET || '';
  const ghToken = process.env.GH_TOKEN || '';
  const owner = process.env.REPO_OWNER || 'cky202401-spec';
  const repo = process.env.REPO_NAME || 'supreme-circle-realm-suggestion-box';

  if (!jwtSecret || !ghToken) {
    return { statusCode: 500, body: JSON.stringify({ message: 'Server not configured' }) };
  }

  // read cookie
  const cookies = (event.headers && (event.headers.cookie || event.headers.Cookie)) || '';
  const match = cookies.match(/(?:^|;\s*)admin_token=([^;]+)/);
  const token = match ? match[1] : null;
  if (!token) return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };

  try {
    jwt.verify(token, jwtSecret);
  } catch (err) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }

  // call GitHub API to list issues labelled suggestion or complaint
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/issues?state=open&per_page=100`;
    const res = await fetch(url, { headers: { Authorization: `token ${ghToken}`, 'User-Agent': 'admin-panel' }});
    if (!res.ok) {
      const text = await res.text();
      return { statusCode: 500, body: JSON.stringify({ message: 'GitHub API error', detail: text }) };
    }
    const issues = await res.json();
    // filter by labels
    const filtered = (issues||[]).filter(i => Array.isArray(i.labels) && i.labels.some(l => {
      const n = (l && l.name) ? l.name.toLowerCase() : '';
      return n === 'suggestion' || n === 'complaint';
    }));
    return { statusCode: 200, body: JSON.stringify(filtered) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
