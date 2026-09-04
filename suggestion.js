// suggestion.js - client logic for the suggestion box
// Set OWNER and REPO so the client can read public issues
const OWNER = "cky202401-spec"; // repo owner for reading public issues
const REPO  = "supreme-circle-realm-suggestion-box";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("suggestionForm");
  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const submitBtn = document.getElementById("submitBtn");
  const status = document.getElementById("status");
  const list = document.getElementById("suggestionsList");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    submitBtn.disabled = true;

    const payload = {
      name: nameInput.value.trim(),
      email: emailInput.value.trim(),
      message: messageInput.value.trim()
    };
    if (!payload.message) {
      status.textContent = "Please write a suggestion.";
      submitBtn.disabled = false;
      return;
    }

    try {
      // Post to serverless function (Netlify/Vercel)
      const res = await fetch("/.netlify/functions/create-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const body = await res.json().catch(()=>({error:"unknown"}));
        status.textContent = "Submit failed: " + (body.message || body.error || res.statusText);
      } else {
        status.textContent = "Thanks — suggestion submitted!";
        form.reset();
        await loadSuggestions();
      }
    } catch (err) {
      status.textContent = "Network error: " + err.message;
    } finally {
      submitBtn.disabled = false;
    }
  });

  async function loadSuggestions() {
    list.innerHTML = "<li>Loading…</li>";
    try {
      const url = `https://api.github.com/repos/${OWNER}/${REPO}/issues?labels=suggestion&state=open&per_page=20`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(res.statusText);
      const issues = await res.json();
      if (!Array.isArray(issues) || issues.length === 0) {
        list.innerHTML = "<li>No suggestions yet</li>";
        return;
      }
      list.innerHTML = issues.map(issue => {
        const user = issue.user ? issue.user.login : "someone";
        const title = escapeHtml(issue.title || "");
        const body = escapeHtml(issue.body || "");
        const date = new Date(issue.created_at).toLocaleString();
        return `<li>
          <div class="suggestion-meta">${title} — <strong>${user}</strong> • ${date}</div>
          <div class="suggestion-body">${body}</div>
        </li>`;
      }).join("");
    } catch (err) {
      list.innerHTML = `<li>Could not load suggestions: ${err.message}</li>`;
    }
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  loadSuggestions();
});
