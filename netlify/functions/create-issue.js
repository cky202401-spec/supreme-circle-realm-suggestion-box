const fetch = require('node-fetch');

exports.handler = async function(event) {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ message: "Method not allowed" }) };

  let payload;
  try { payload = JSON.parse(event.body || "{}"); } catch (err) { return { statusCode: 400, body: JSON.stringify({ message: "Invalid JSON" }) }; }

  const name = (payload.name || "Anonymous").trim();
  const email = (payload.email || "").trim();
  const message = (payload.message || "").trim();
  if (!message) return { statusCode: 400, body: JSON.stringify({ message: "Message required" }) };

  const token = process.env.GITHUB_TOKEN;
  if (!token) return { statusCode: 500, body: JSON.stringify({ message: "Server misconfigured: token missing" }) };

  const repo = process.env.SUGGESTION_REPO || "cky202401-spec/supreme-circle-realm-suggestion-box";
  const [owner, repoName] = repo.split("/");

  const title = `Supreme Circle Realm Suggestion Box — Suggestion from ${name}`;
  const body = `**Suggestion submitted to Supreme Circle Realm Suggestion Box**\n\n${message}\n\n---\n**From:** ${name}${ email ? ` (${email})` : "" }\n**Submitted:** ${new Date().toISOString()}`;

  try {
    const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "suggestion-box-netlify"
      },
      body: JSON.stringify({
        title,
        body,
        labels: ["suggestion"]
      })
    });
    const ghBody = await ghRes.json();
    if (!ghRes.ok) return { statusCode: ghRes.status || 500, body: JSON.stringify({ message: ghBody.message || "GitHub error", error: ghBody }) };
    return { statusCode: 200, body: JSON.stringify({ issue: ghBody.html_url }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ message: err.message }) };
  }
};
