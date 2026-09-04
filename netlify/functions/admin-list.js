const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (err) { return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON" }) }; }
  const password = (payload.password || "").trim();
  const adminPassword = process.env.SUGGESTION_ADMIN_PASSWORD;
  if (!adminPassword) return { statusCode: 500, body: JSON.stringify({ message: "Server misconfigured: admin password missing" }) };
  if (password !== adminPassword) return { statusCode: 403, body: JSON.stringify({ message: "Forbidden" }) };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ message: "Server misconfigured: token missing" }) };

  const repo = process.env.SUGGESTION_REPO || "cky202401-spec/supreme-circle-realm-suggestion-box";
  const [owner, repoName] = repo.split("/");

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues?labels=suggestion&state=open&per_page=100`, {
      headers: { Authorization: `token ${token}`, "User-Agent": "suggestion-box-netlify" }
    });
    const ghBody = await ghRes.json();
    if (!ghRes.ok) return { statusCode: ghRes.status || 500, body: JSON.stringify({ message: ghBody.message || "GitHub error", error: ghBody }) };
    return { statusCode: 200, body: JSON.stringify({ issues: ghBody }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
