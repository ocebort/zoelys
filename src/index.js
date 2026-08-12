export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -------------------------------------------------------------
    // AUTHENTICATION (WITH ADMIN DETECTION FOR ocebort@gmail.com)
    // -------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      try {
        const body = await request.json();
        const emailClean = (body.email || '').trim().toLowerCase();
        const passClean = (body.password || '').trim();
        const id = 'usr-' + crypto.randomUUID().slice(0, 8);
        const tier = body.tier || 'Platinum ($125/mo)';
        const credits = tier.includes('Gold') ? 5 : tier.includes('Platinum') ? 10 : 15;

        await env.zoelys_db.prepare(`
          INSERT INTO users (id, email, password_hash, full_name, subscription_tier, credit_balance)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, emailClean, passClean, body.full_name || 'Member', tier, credits).run();

        if (body.pet_name) {
          const petId = 'pet-' + crypto.randomUUID().slice(0, 8);
          await env.zoelys_db.prepare(`
            INSERT INTO pets (id, user_id, pet_name, species, breed, medical_needs, feeding_instructions, behavioral_quirks)
            VALUES (?, ?, ?, 'Dog', 'Golden Retriever / Mix', 'Daily vitamins', '1.5 cups kibble @ 8am & 6pm', 'Friendly, loves swimming')
          `).bind(petId, id, body.pet_name).run();
        }

        const isAdmin = emailClean === 'ocebort@gmail.com' ? 1 : 0;
        return new Response(JSON.stringify({ success: true, userId: id, full_name: body.full_name, is_admin: isAdmin }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'User already exists' }), { status: 400 });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      try {
        const body = await request.json();
        const emailClean = (body.email || '').trim().toLowerCase();
        const passClean = (body.password || '').trim();

        const user = await env.zoelys_db.prepare(`
          SELECT id, email, full_name, subscription_tier, credit_balance FROM users 
          WHERE LOWER(TRIM(email)) = ? AND password_hash = ?
        `).bind(emailClean, passClean).first();

        if (!user) {
          return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401 });
        }

        const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;
        return new Response(JSON.stringify({ success: true, user: { ...user, is_admin: isAdmin } }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // REAL-TIME CLOUDFLARE D1 ADMIN STATS
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/admin/stats') {
      try {
        const usersCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM users`).first();
        const sittersCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM sitters`).first();
        const requestsCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM client_requests`).first();
        const eventsCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM events`).first();
        const partnersCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM partners`).first();

        return new Response(JSON.stringify({
          total_members: usersCount ? usersCount.count : 0,
          total_sitters: sittersCount ? sittersCount.count : 0,
          total_requests: requestsCount ? requestsCount.count : 0,
          total_events: eventsCount ? eventsCount.count : 0,
          total_partners: partnersCount ? partnersCount.count : 0
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // USER PROFILE & CONCIERGE DATA
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/user/profile') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response("Missing userId", { status: 400 });

        const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(userId).first();
        const { results: pets } = await env.zoelys_db.prepare(`SELECT * FROM pets WHERE user_id = ?`).bind(userId).all();

        const isAdmin = user && user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        const sampleSittings = [
          {
            id: 'sit-101',
            sitter_name: 'Camila Rodriguez',
            role: 'Certified Vet Tech & Dog Specialist',
            service_type: 'Overnight Stay (24h)',
            dates: 'Sept 18 - Sept 20, 2026',
            status: 'Confirmed & Scheduled',
            credits_used: 9,
            match_score: '98% Match',
            location: 'Brickell Heights, Miami'
          }
        ];

        return new Response(JSON.stringify({
          user: { ...user, is_admin: isAdmin },
          pets: pets || [],
          sittings: sampleSittings
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // GENERAL API ENDPOINTS
    // -------------------------------------------------------------
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

    return env.ASSETS.fetch(request);
  }
};
