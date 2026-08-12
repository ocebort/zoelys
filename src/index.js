export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // GET / POST API Routes for EVENTS
    if (url.pathname === '/api/events') {
      if (request.method === 'GET') {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC`).all();
        return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        const id = 'event-' + crypto.randomUUID().slice(0, 8);
        await env.zoelys_db.prepare(`
          INSERT INTO events (id, title, event_date, location, description, is_published)
          VALUES (?, ?, ?, ?, ?, 1)
        `).bind(id, body.title, body.event_date, body.location || '', body.description || '').run();
        return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // GET / POST API Routes for PARTNERS
    if (url.pathname === '/api/partners') {
      if (request.method === 'GET') {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM partners WHERE is_active = 1`).all();
        return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        const id = 'partner-' + crypto.randomUUID().slice(0, 8);
        await env.zoelys_db.prepare(`
          INSERT INTO partners (id, name, category, website_url, is_active)
          VALUES (?, ?, ?, ?, 1)
        `).bind(id, body.name, body.category || 'Luxury Partner', body.website_url || '#').run();
        return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    // GET / POST API Routes for CLIENT REQUESTS
    if (url.pathname === '/api/requests') {
      if (request.method === 'GET') {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM client_requests ORDER BY created_at DESC`).all();
        return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
      }
      if (request.method === 'POST') {
        const body = await request.json();
        const id = crypto.randomUUID();
        await env.zoelys_db.prepare(`
          INSERT INTO client_requests (id, full_name, email, neighbourhood, pet_type, pet_name, medical_conditions)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(id, body.full_name, body.email, body.neighbourhood || '', body.pet_type || '', body.pet_name || '', body.medical_conditions || 'No').run();
        return new Response(JSON.stringify({ success: true, id }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    return env.ASSETS.fetch(request);
  }
};
