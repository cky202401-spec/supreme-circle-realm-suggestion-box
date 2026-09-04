# Supreme Circle Realm Suggestion Box

Static frontend + Netlify serverless functions to create GitHub Issues for suggestions.

Deploy options

- Static preview only (no backend): enable GitHub Pages (main branch, root). You will get a static site at:
  https://cky202401-spec.github.io/supreme-circle-realm-suggestion-box/
  (Serverless functions will NOT work on GitHub Pages.)

- Full functionality (recommended): deploy to Netlify or Vercel and set the environment variables below.

Required environment variables (Netlify/Vercel):

- GITHUB_TOKEN = personal access token with repo or public_repo scope
- SUGGESTION_REPO = owner/repo (optional — defaults to this repo)
- SUGGESTION_ADMIN_PASSWORD = admin password (do NOT commit this to the repo)

Notes

- Do NOT commit GITHUB_TOKEN or SUGGESTION_ADMIN_PASSWORD into the repository. Use environment variables in your hosting provider.
- You previously mentioned the admin password `97753024` — set it as SUGGESTION_ADMIN_PASSWORD on Netlify/Vercel (and rotate if needed).
