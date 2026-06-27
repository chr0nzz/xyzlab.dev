export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    if (!env.KOFI_TOKEN || !env.GITHUB_TOKEN || !env.GIST_ID) {
      console.error('kofi-webhook misconfigured: missing KOFI_TOKEN, GITHUB_TOKEN or GIST_ID');
      return new Response('Misconfigured', { status: 500 });
    }

    const formData = await request.formData();
    const raw = formData.get('data');
    if (!raw) return new Response('Bad request', { status: 400 });

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    if (payload.verification_token !== env.KOFI_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!payload.is_public) {
      return new Response('OK', { status: 200 });
    }

    const entry = {
      name: payload.from_name || 'Anonymous',
      amount: parseFloat(payload.amount) || 0,
      currency: payload.currency || 'USD',
      message: payload.message || '',
      date: payload.timestamp || new Date().toISOString(),
    };

    const gistUrl = `https://api.github.com/gists/${env.GIST_ID}`;
    const auth = { Authorization: `Bearer ${env.GITHUB_TOKEN}`, 'User-Agent': 'kofi-webhook' };

    try {
      const gistRes = await fetch(gistUrl, { headers: auth });
      if (!gistRes.ok) {
        console.error('gist read failed', gistRes.status, await gistRes.text());
        return new Response('Upstream read failed', { status: 502 });
      }

      const gist = await gistRes.json();
      const file = gist.files && gist.files['sponsors.json'];
      let existing = [];
      if (file && file.content) {
        try { existing = JSON.parse(file.content); } catch { existing = []; }
      }
      if (!Array.isArray(existing)) existing = [];

      existing.unshift(entry);
      const updated = existing.slice(0, 50);

      const patchRes = await fetch(gistUrl, {
        method: 'PATCH',
        headers: { ...auth, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: { 'sponsors.json': { content: JSON.stringify(updated, null, 2) } },
        }),
      });

      if (!patchRes.ok) {
        console.error('gist write failed', patchRes.status, await patchRes.text());
        return new Response('Upstream write failed', { status: 502 });
      }

      return new Response('OK', { status: 200 });
    } catch (err) {
      console.error('kofi-webhook error', err && err.message);
      return new Response('Server error', { status: 500 });
    }
  },
};
