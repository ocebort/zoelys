export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const corsHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // REGISTER
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

        // STRICT CHECK: ONLY ocebort@gmail.com IS ADMIN
        const isAdmin = emailClean === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ 
          success: true, 
          userId: id, 
          full_name: body.full_name, 
          role, 
          is_admin: isAdmin 
        }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'User already exists or registration failed' }), { status: 400, headers: corsHeaders });
      }
    }

    // LOGIN
    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      try {
        const body = await request.json();
        const emailClean = (body.email || '').trim().toLowerCase();
        const passClean = (body.password || '').trim();

        const user = await env.zoelys_db.prepare(`
          SELECT id, email, full_name, subscription_tier, credit_balance FROM users 
          WHERE LOWER(TRIM(email)) = ? AND password_hash = ?
        `).bind(emailClean, passClean).first();

        if (!user) return new Response(JSON.stringify({ error: 'Invalid email or password' }), { status: 401, headers: corsHeaders });

        const role = user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter' ? 'sitter' : 'owner';
        // STRICT CHECK: ONLY ocebort@gmail.com IS ADMIN
        const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ success: true, user: { ...user, role, is_admin: isAdmin } }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // USER PROFILE FETCH
    if (request.method === 'GET' && url.pathname === '/api/user/profile') {
      try {
        const userId = url.searchParams.get('userId');
        if (!userId) return new Response(JSON.stringify({ error: 'Missing userId' }), { status: 400, headers: corsHeaders });

        const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(userId).first();
        
        if (!user) {
          return new Response(JSON.stringify({ 
            user: { id: userId, email: 'member@zoelys.com', full_name: 'Member', subscription_tier: 'Platinum ($125/mo)', credit_balance: 8, role: 'owner', is_admin: 0 } 
          }), { headers: corsHeaders });
        }

        const role = user.id.startsWith('sit-') || user.subscription_tier === 'Vetted Sitter' ? 'sitter' : 'owner';
        // STRICT CHECK: ONLY ocebort@gmail.com IS ADMIN
        const isAdmin = user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;

        return new Response(JSON.stringify({ user: { ...user, role, is_admin: isAdmin } }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: corsHeaders });
      }
    }

    // PET MANUAL API
    if (request.method === 'POST' && url.pathname === '/api/user/pet-manual') {
      const body = await request.json();
      await env.zoelys_db.prepare(`
        INSERT INTO pets (id, user_id, pet_name, species, breed, medical_needs)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind('pet-' + crypto.randomUUID().slice(0, 6), body.user_id, body.pet_name || 'Companion', 'Dog', body.breed || 'Standard', body.instructions || 'Care notes').run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // CREDIT TOP UP
    if (request.method === 'POST' && url.pathname === '/api/user/add-credits') {
      const body = await request.json();
      await env.zoelys_db.prepare(`UPDATE users SET credit_balance = credit_balance + ? WHERE id = ?`).bind(body.amount || 5, body.user_id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // EVENTS & PARTNERS APIs
    if (request.method === 'GET' && url.pathname === '/api/events') {
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM events ORDER BY rowid DESC`).all();
      return new Response(JSON.stringify({ events: results || [] }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/events') {
      const body = await request.json();
      await env.zoelys_db.prepare(`INSERT INTO events (id, title, category, date, location, image_url, sponsor, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).bind('evt-' + crypto.randomUUID().slice(0,6), body.title, body.category, body.event_date, body.location, body.image_url, body.sponsor, body.description).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/events/')) {
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`DELETE FROM events WHERE id = ?`).bind(id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    if (request.method === 'GET' && url.pathname === '/api/partners') {
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM partners ORDER BY rowid DESC`).all();
      return new Response(JSON.stringify({ partners: results || [] }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/partners') {
      const body = await request.json();
      await env.zoelys_db.prepare(`INSERT INTO partners (id, name, category, perk, image_url, website_url, description) VALUES (?, ?, ?, ?, ?, ?, ?)`).bind('prt-' + crypto.randomUUID().slice(0,6), body.name, body.category, body.perk, body.image_url, body.website_url, body.description).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/partners/')) {
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`DELETE FROM partners WHERE id = ?`).bind(id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  }
};
