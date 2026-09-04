// Simple admin client logic
document.addEventListener('DOMContentLoaded', () => {
  const loginCard = document.getElementById('loginCard');
  const adminArea = document.getElementById('adminArea');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const passwd = document.getElementById('adminPassword');
  const status = document.getElementById('loginStatus');
  const issuesList = document.getElementById('issuesList');

  loginBtn.addEventListener('click', async () => {
    status.textContent = '';
    loginBtn.disabled = true;
    try {
      const res = await fetch('/.netlify/functions/admin-login', {
        method: 'POST',
        credentials: 'include', // accept Set-Cookie
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwd.value })
      });
      const body = await res.json().catch(()=>({}));
      if (!res.ok) {
        status.textContent = body.message || 'Sign-in failed';
      } else {
        passwd.value = '';
        showAdmin();
      }
    } catch (err) {
      status.textContent = 'Network error';
    } finally {
      loginBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener('click', async () => {
    await fetch('/.netlify/functions/admin-login?logout=1', { method: 'GET', credentials: 'include' });
    adminArea.classList.add('hidden');
    loginCard.classList.remove('hidden');
  });

  async function showAdmin(){
    loginCard.classList.add('hidden');
    adminArea.classList.remove('hidden');
    issuesList.innerHTML = '<li>Loading…</li>';
    try {
      const res = await fetch('/.netlify/functions/admin-issues', { credentials: 'include' });
      if (!res.ok) {
        const b = await res.json().catch(()=>({}));
        issuesList.innerHTML = `<li>Error: ${b.message || res.statusText}</li>`;
        return;
      }
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        issuesList.innerHTML = '<li>No issues found</li>';
        return;
      }
      issuesList.innerHTML = data.map(i => {
        const title = escapeHtml(i.title || '');
        const body = escapeHtml(i.body || '');
        const user = i.user ? i.user.login : 'someone';
        const date = new Date(i.created_at).toLocaleString();
        const labels = (i.labels||[]).map(l => l.name).join(', ');
        return `<li style="margin-bottom:12px"><strong>${title}</strong> <em>(${labels})</em><br>${body}<br><small>by ${user} • ${date}</small></li>`;
      }).join('');
    } catch(err){
      issuesList.innerHTML = `<li>Network error: ${err.message}</li>`;
    }
  }

  function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  // Try to load admin area automatically (if cookie present)
  (async () => {
    try {
      const res = await fetch('/.netlify/functions/admin-issues', { credentials: 'include' });
      if (res.ok) showAdmin();
    } catch(_) {}
  })();
});
