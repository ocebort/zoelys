export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -------------------------------------------------------------
    // AUTHENTICATION
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
            VALUES (?, ?, ?, 'Dog', 'Golden Retriever / Mix', 'Daily vitamins with morning meal', '1.5 cups kibble morning/evening', 'Friendly, loves swimming')
          `).bind(petId, id, body.pet_name).run();
        }

        return new Response(JSON.stringify({ success: true, userId: id, full_name: body.full_name }), {
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

        return new Response(JSON.stringify({ success: true, user }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // RICH USER PROFILE & CONCIERGE DATA
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/user/profile') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response("Missing userId", { status: 400 });

        const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(userId).first();
        const { results: pets } = await env.zoelys_db.prepare(`SELECT * FROM pets WHERE user_id = ?`).bind(userId).all();
        const { results: requests } = await env.zoelys_db.prepare(`SELECT * FROM client_requests ORDER BY created_at DESC LIMIT 3`).all();

        // Sample rich sitting matches & assigned sitters
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
          },
          {
            id: 'sit-102',
            sitter_name: 'Mateo Silva',
            role: 'Zoélys Vetted Sitter',
            service_type: 'Home Visit & Walk (1h)',
            dates: 'August 28, 2026',
            status: 'Completed',
            credits_used: 3,
            match_score: '95% Match',
            location: 'Coconut Grove, Miami'
          }
        ];

        // Sample upcoming RSVPs & Partner Perks
        const sampleRSVPs = [
          { title: 'Paws & Prosecco Rooftop Mixer', date: 'Sat, Sept 19 • 18:00', location: 'Brickell Heights Rooftop' }
        ];

        return new Response(JSON.stringify({
          user,
          pets: pets || [],
          requests: requests || [],
          sittings: sampleSittings,
          rsvps: sampleRSVPs
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
    if (url.pathname === '/api/events' && request.method === 'GET') {
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM events WHERE is_published = 1 ORDER BY event_date ASC`).all();
      return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
    }

    if (url.pathname === '/api/partners' && request.method === 'GET') {
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM partners WHERE is_active = 1`).all();
      return new Response(JSON.stringify(results || []), { headers: { 'Content-Type': 'application/json' } });
    }

    return env.ASSETS.fetch(request);
  }
};
