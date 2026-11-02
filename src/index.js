export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Route API pour récupérer les animaux du propriétaire
    if (url.pathname === '/api/owner/pets') {
      try {
        const { results } = await env.zoelys_db.prepare(
          "SELECT * FROM pets WHERE owner_id = ?"
        ).bind('usr_owner_01').all();

        return new Response(JSON.stringify({ pets: results }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }

    // 2. Route API générique
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: true, service: 'zoelys' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 3. Cloudflare sert automatiquement les fichiers de 'public/' (dont /dashboard/owner/index.html)
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        const indexUrl = new URL('/index.html', request.url);
        response = await env.ASSETS.fetch(new Request(indexUrl, request));
      }
      return response;
    } catch (e) {
      return env.ASSETS.fetch(request);
    }
  }
};
