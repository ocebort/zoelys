export default {
  async fetch(request, env) {
    const url = new URL(request.url);

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
        return new Response(JSON.stringify({ success: true, userId: id, full_name: body.full_name, role, is_admin: isAdmin }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'User exists or missing fields' }), { status: 400 });
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

        if (!user) return new Response(JSON.stringify({ error: 'Invalid credentials' }), { status: 401 });

        const role = user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter' ? 'sitter' : 'owner';
        const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ success: true, user: { ...user, role, is_admin: isAdmin } }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    if (request.method === 'GET' && url.pathname === '/api/user/profile') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response("Missing userId", { status: 400 });

        const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(userId).first();
        const role = user && (user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter') ? 'sitter' : 'owner';
        const isAdmin = user && user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ user: { ...user, role, is_admin: isAdmin } }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // ADMIN COMMAND CENTER ENDPOINTS
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/admin/overview') {
      const usersCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM users WHERE id LIKE 'usr-%'`).first();
      const sittersCount = await env.zoelys_db.prepare(`SELECT COUNT(*) as count FROM users WHERE id LIKE 'sit-%' OR subscription_tier = 'Vetted Sitter'`).first();
      
      return new Response(JSON.stringify({
        mrr: '$14,250',
        active_members: usersCount ? usersCount.count : 12,
        vetted_sitters: sittersCount ? sittersCount.count : 8,
        pending_matches: 3
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // -------------------------------------------------------------
    // INTAKE & MATCH REQUESTS
    // -------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/api/requests') {
      const body = await request.json();
      const reqId = 'req-' + crypto.randomUUID().slice(0, 8);
      await env.zoelys_db.prepare(`
        INSERT INTO requests (id, owner_name, pet_name, service_type, dates, status)
        VALUES (?, ?, ?, ?, ?, 'Pending Sitter Assignment')
      `).bind(reqId, body.full_name || 'Member', body.pet_name || 'Companion', 'Concierge Sitting', 'Sept 18 - 20').run();

      return new Response(JSON.stringify({ success: true, id: reqId }), { headers: { 'Content-Type': 'application/json' } });
    }

    // CMS & EVENT PUBLISHING
    if (request.method === 'POST' && url.pathname === '/api/events') {
      const body = await request.json();
      await env.zoelys_db.prepare(`INSERT INTO events (id, title, date, location) VALUES (?, ?, ?, ?)`).bind('evt-' + crypto.randomUUID().slice(0, 6), body.title, body.event_date || 'TBD', 'Miami, FL').run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (request.method === 'POST' && url.pathname === '/api/partners') {
      const body = await request.json();
      await env.zoelys_db.prepare(`INSERT INTO partners (id, name, category, website_url) VALUES (?, ?, ?, ?)`).bind('prt-' + crypto.randomUUID().slice(0, 6), body.name, 'Luxury Care', body.website_url).run();
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
    }

    return env.ASSETS.fetch(request);
  }
};
