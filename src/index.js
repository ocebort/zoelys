export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Force strict no-cache headers for instant dev updates
    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // AUTHENTICATION & PROFILES
    // -------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/api/auth/register') {
      try {
        const body = await request.json();
        const emailClean = (body.email || '').trim().toLowerCase();
        const passClean = (body.password || '').trim();
        const role = body.role || 'owner';
        const id = (role === 'sitter' ? 'sit-' : 'usr-') + crypto.randomUUID().slice(0, 8);
        const tier = body.tier || 'Platinum ($125/mo)';
        const credits = tier.includes('Gold') ? 5 : tier.includes('Platinum') ? 10 : 15;

        await env.zoelys_db.prepare(`
          INSERT INTO users (id, email, password_hash, full_name, subscription_tier, credit_balance)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(id, emailClean, passClean, body.full_name || 'Member', role === 'sitter' ? 'Vetted Sitter' : tier, credits).run();

        const isAdmin = emailClean === 'ocebort@gmail.com' ? 1 : 0;
        return new Response(JSON.stringify({ success: true, userId: id, full_name: body.full_name, role, is_admin: isAdmin }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'User exists or missing fields' }), { status: 400, headers: corsHeaders });
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

        if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401, headers: corsHeaders });

        const role = user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter' ? 'sitter' : 'owner';
        const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ success: true, user: { ...user, role, is_admin: isAdmin } }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/user/profile') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response("Missing userId", { status: 400, headers: corsHeaders });

        const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(userId).first();
        const role = user && (user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter') ? 'sitter' : 'owner';
        const isAdmin = user && user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ user: { ...user, role, is_admin: isAdmin } }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // -------------------------------------------------------------
    // EVENTS API (GET, POST, DELETE)
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/events') {
      try {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM events ORDER BY rowid DESC`).all();
        const fallback = [
          { id: 'evt-1', title: 'Paws & Prosecco Rooftop Social', category: 'Social Mixer', date: 'Sun, Oct 12 • 17:00 – 20:00', location: 'Faena Penthouse, Miami', sponsor: 'Equinox & Faena', description: 'Join fellow members for an exclusive sunset gathering.', image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80' },
          { id: 'evt-2', title: 'Sunset Dog Yoga & Wellness', category: 'Wellness & Yoga', date: 'Sat, Oct 18 • 09:00 – 11:00', location: 'South Pointe Park, Miami', sponsor: 'Lululemon', description: 'Realign mind and body with guided canine yoga.', image_url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?auto=format&fit=crop&w=800&q=80' }
        ];
        return new Response(JSON.stringify({ events: results && results.length > 0 ? results : fallback }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ events: [] }), { headers: corsHeaders });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/events') {
      const body = await request.json();
      const id = 'evt-' + crypto.randomUUID().slice(0, 6);
      await env.zoelys_db.prepare(`
        INSERT INTO events (id, title, category, date, location, image_url, sponsor, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(id, body.title || 'Untitled Event', body.category || 'Social Mixer', body.event_date || 'TBD', body.location || 'Miami, FL', body.image_url || '', body.sponsor || 'Zoélys Concierge', body.description || '').run().catch(() => {});
      
      return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/events/')) {
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // PARTNERS API (GET, POST, DELETE)
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/partners') {
      try {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM partners ORDER BY rowid DESC`).all();
        const fallback = [
          { id: 'prt-1', name: 'Brickell Vet Care', category: 'Veterinary Care', perk: 'Complimentary First Health Exam + 15% Off Visits', website_url: 'https://brickellvet.com', description: 'Miami premier 24/7 emergency and holistic vet hospital.', image_url: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80' },
          { id: 'prt-2', name: 'K9 Luxury Spa & Grooming', category: 'Luxury Grooming', perk: 'VIP Hydro-Therapy & Free Paw Spa Upgrade', website_url: 'https://k9spa.com', description: 'Organic coat styling and soothing claw care.', image_url: 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=800&q=80' }
        ];
        return new Response(JSON.stringify({ partners: results && results.length > 0 ? results : fallback }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ partners: [] }), { headers: corsHeaders });
      }
    }

    if (request.method === 'POST' && url.pathname === '/api/partners') {
      const body = await request.json();
      const id = 'prt-' + crypto.randomUUID().slice(0, 6);
      await env.zoelys_db.prepare(`
        INSERT INTO partners (id, name, category, perk, image_url, website_url, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, body.name || 'Partner', body.category || 'Veterinary Care', body.perk || 'Exclusive Perk', body.image_url || '', body.website_url || '#', body.description || '').run().catch(() => {});
      
      return new Response(JSON.stringify({ success: true, id }), { headers: corsHeaders });
    }

    if (request.method === 'DELETE' && url.pathname.startsWith('/api/partners/')) {
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`DELETE FROM partners WHERE id = ?`).bind(id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // -------------------------------------------------------------
    // ASSET FETCHING WITH NO-CACHE
    // -------------------------------------------------------------
    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  }
};
