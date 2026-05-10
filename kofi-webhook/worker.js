export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
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

    if (env.KOFI_TOKEN && payload.verification_token !== env.KOFI_TOKEN) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (!payload.is_public) {
      return new Response('OK', { status: 200 });
    }

    const name = payload.from_name || 'Anonymous';
    const amount = parseFloat(payload.amount) || 0;
    const currency = payload.currency || 'USD';
    const message = payload.message || '';
    const date = payload.timestamp || new Date().toISOString();

    const gistId = env.GIST_ID;
    const token = env.GITHUB_TOKEN;

    const gistRes = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'kofi-webhook' },
    });
    const gist = await gistRes.json();
    const existing = JSON.parse(gist.files['sponsors.json'].content);

    existing.unshift({ name, amount, currency, message, date });
    const updated = existing.slice(0, 50);

    await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'kofi-webhook',
      },
      body: JSON.stringify({
        files: { 'sponsors.json': { content: JSON.stringify(updated, null, 2) } },
      }),
    });

    return new Response('OK', { status: 200 });
  },
};
