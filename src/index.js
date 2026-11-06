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

    // NOUVELLE ROUTE : Enregistrement des demandes de "Find a Sitter" liées au compte
    if (url.pathname === '/api/requests' && request.method === 'POST') {
      try {
        const urlParams = url.searchParams;
        const userId = urlParams.get('userId') || 'guest_tester';
        const data = await request.json();

        // Insertion dans votre base de données D1
        await env.zoelys_db.prepare(`
          INSERT INTO requests (user_id, full_name, email, pet_name, pet_type, service_type, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `).bind(
          userId,
          data.full_name || '',
          data.email || '',
          data.pet_name || '',
          data.pet_type || '',
          data.service_type || ''
        ).run();

        return new Response(JSON.stringify({ success: true, requestId: true }), {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), {
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

    // 3. Cloudflare sert automatiquement les fichiers de 'public/'
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
