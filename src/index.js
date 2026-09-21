let postsBootstrapped = false;
let matchmakingBootstrapped = false;

async function ensureMatchmaking(env) {
  if (matchmakingBootstrapped) return;
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS client_requests (
    id TEXT PRIMARY KEY,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    neighbourhood TEXT,
    pet_type TEXT,
    pet_name TEXT,
    breed TEXT,
    behavioral_traits TEXT,
    medical_conditions TEXT,
    exercise_needs TEXT,
    service_type TEXT,
    start_date TEXT,
    end_date TEXT,
    outdoor_space TEXT,
    experience_level TEXT
  )`).run();
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS sitters (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    neighbourhood TEXT NOT NULL,
    experience_years INTEGER DEFAULT 1,
    vet_tech_background BOOLEAN DEFAULT 0,
    accepted_pet_types TEXT NOT NULL,
    can_handle_anxiety BOOLEAN DEFAULT 1,
    can_handle_medication BOOLEAN DEFAULT 0,
    has_outdoor_space BOOLEAN DEFAULT 0,
    nightly_rate_usd REAL NOT NULL,
    is_active BOOLEAN DEFAULT 1
  )`).run();
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    sitter_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();

  const row = await env.zoelys_db.prepare(`SELECT COUNT(*) AS c FROM sitters`).first();
  if (row && row.c === 0) {
    const seeds = [
      ['sitter-1', 'Elena Rostova', 'Brickell', 5, 1, 'Dog,Cat', 1, 1, 1, 85.00],
      ['sitter-2', 'Marcus Vance', 'Coconut Grove', 4, 0, 'Dog', 1, 0, 1, 65.00],
      ['sitter-3', 'Sophia Chen', 'South Beach', 3, 0, 'Cat', 1, 0, 0, 70.00]
    ];
    for (const s of seeds) {
      await env.zoelys_db.prepare(`INSERT OR IGNORE INTO sitters (id, full_name, neighbourhood, experience_years, vet_tech_background, accepted_pet_types, can_handle_anxiety, can_handle_medication, has_outdoor_space, nightly_rate_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).bind(...s).run();
    }
  }
  matchmakingBootstrapped = true;
}

async function ensurePosts(env) {
  if (postsBootstrapped) return;
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category TEXT,
    author TEXT,
    publish_date TEXT,
    read_time TEXT,
    excerpt TEXT,
    image_url TEXT,
    content TEXT,
    featured INTEGER DEFAULT 0
  )`).run();

  const row = await env.zoelys_db.prepare(`SELECT COUNT(*) AS c FROM posts`).first();
  if (row && row.c > 0) { postsBootstrapped = true; return; }

  const seeds = [
    {
      slug: 'makes-a-great-pet-sitter',
      title: 'What actually makes a great pet sitter',
      category: 'Behind Zoélys',
      author: 'Océane Bort',
      publish_date: '2026-06-06',
      read_time: '6 min read',
      excerpt: "It's rarely the longest résumé. It's the small, quiet attentions — and we know how to spot them.",
      image_url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&q=80&w=1200',
      featured: 1,
      content: `When most owners look for pet care, they scan résumés for years of experience, certifications, or formal qualifications. While those credentials matter, our years of vetting sitters at Zoélys have proven one simple truth: the longest résumé rarely predicts the best care environment.

True pet sitting isn't merely about adherence to a feeding schedule or ensuring the back door is locked. It is an exercise in emotional attunement. Animals communicate silently through micro-adjustments in posture, eye contact, pace, and breathing.

> The best sitters don't force engagement — they create space for trust to arrive on the animal's terms.

## The Quiet Attentions

What sets an exceptional sitter apart is what we call the quiet attentions. It is noticing that a senior Whippet prefers her blanket folded twice rather than flat. It is recognizing the difference between a cat seeking play and a cat asking to be left undisturbed under a shaded chair.

When vetting candidates for the Zoélys Certified badge, we evaluate empathy over enthusiasm. High energy can often overwhelm an already anxious pet whose owners just left. Calm, steady, and predictable presence is what keeps a home grounded.

## The Environment of Ease

When you leave your pet in someone else's hands, you aren't just paying for supervision; you are buying their emotional state while you are away. A great sitter seamlessly blends into your pet's existing rhythm so completely that your absence feels like a gentle pause, rather than a disruption.`
    },
    {
      slug: 'puppy-training-first-90-days',
      title: 'How to train your puppy — the first 90 days',
      category: 'Training',
      author: 'Océane Bort',
      publish_date: '2026-06-20',
      read_time: '12 min read',
      excerpt: 'Three months that shape the next fifteen years. A gentle, structured guide to those early weeks at home.',
      image_url: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&q=80&w=1200',
      featured: 0,
      content: `The first ninety days with a puppy set the emotional and behavioural blueprint for the rest of their life. What feels like a frantic blur of chewed shoes and interrupted sleep is, in fact, a narrow window of remarkable plasticity.

## Week One to Four — Safety, Routine, Trust

Before any trick, a puppy needs a predictable world. Establish a fixed rhythm for meals, naps, and bathroom breaks. Consistency is the first language they learn, and it calms them more than any toy.

## Week Five to Eight — The Foundations of Attention

Puppies learn through success, not correction. Reward the behaviour you want to see — a calm sit, a soft mouth, eyes on you — and ignore what you don't. Short sessions of five to ten minutes, several times a day, far outweigh one long lesson.

## Week Nine to Twelve — The World Beyond Home

Once vaccinations allow, take your puppy into the world with intention. Let them watch traffic, meet calm adult dogs, hear new sounds. The goal is not to meet everyone, but to learn that the world is safe, ordinary, and predictable.`
    },
    {
      slug: 'choose-right-dog-food',
      title: 'How to choose the right food for your dog',
      category: 'Nutrition',
      author: 'Océane Bort',
      publish_date: '2026-07-01',
      read_time: '10 min read',
      excerpt: 'Forget the marketing. Three principles, one label-reading habit, and a vet on speed-dial.',
      image_url: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&q=80&w=1200',
      featured: 0,
      content: `Every bag on the shelf claims to be the best. The truth is simpler than the marketing budget suggests: the right food is the one that suits your dog's age, body condition, and health history — not the one with the prettiest packaging.

## Three Principles

First, feed the animal in front of you, not the breed on the box. A lazy senior Chihuahua and a working-line Border Collie have radically different energy requirements.

Second, a named animal protein should lead the ingredient list. That is the single most reliable signal of quality.

Third, transition slowly. A new food should be introduced over seven to ten days, gradually replacing the old, so your dog's gut has time to adapt.

## The Label-Reading Habit

Learn to check the guaranteed analysis and the calorie content (kcal per cup or can) before you check the adjectives. And when in doubt, ask your veterinarian — they know your dog's medical history, which no marketing department ever will.`
    }
  ];

  for (const p of seeds) {
    await env.zoelys_db.prepare(`INSERT OR IGNORE INTO posts (id, title, slug, category, author, publish_date, read_time, excerpt, image_url, content, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind('post-' + p.slug, p.title, p.slug, p.category, p.author, p.publish_date, p.read_time, p.excerpt, p.image_url, p.content, p.featured).run();
  }
  postsBootstrapped = true;
}

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

    // HEALTH CHECK
    if (request.method === 'GET' && url.pathname === '/api/health') {
      return new Response(JSON.stringify({ ok: true, service: 'zoelys', time: new Date().toISOString() }), { headers: corsHeaders });
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

    // CLIENT MATCHMAKING REQUEST (owner intake)
    if (request.method === 'POST' && url.pathname === '/api/requests') {
      try {
        await ensureMatchmaking(env);
        const body = await request.json();
        const id = 'req-' + crypto.randomUUID().slice(0, 8);
        await env.zoelys_db.prepare(`
          INSERT INTO client_requests (id, full_name, email, neighbourhood, pet_type, pet_name, breed, behavioral_traits, medical_conditions, exercise_needs, service_type, start_date, end_date, outdoor_space, experience_level)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          body.full_name, body.email, body.neighbourhood,
          body.pet_type, body.pet_name, body.breed,
          body.behavioral_traits, body.medical_conditions, body.exercise_needs,
          body.service_type, body.start_date, body.end_date,
          body.outdoor_space, body.experience_level
        ).run();
        return new Response(JSON.stringify({ success: true, requestId: id }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Request could not be saved' }), { status: 400, headers: corsHeaders });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/requests') {
      await ensureMatchmaking(env);
      const email = (url.searchParams.get('email') || '').trim().toLowerCase();
      const { results } = email
        ? await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE LOWER(TRIM(email)) = ? ORDER BY created_at DESC`).bind(email).all()
        : await env.zoelys_db.prepare(`SELECT * FROM client_requests ORDER BY created_at DESC`).all();
      return new Response(JSON.stringify({ requests: results || [] }), { headers: corsHeaders });
    }

    // SITTERS ROSTER API
    if (request.method === 'POST' && url.pathname === '/api/sitters') {
      try {
        await ensureMatchmaking(env);
        const body = await request.json();
        const id = 'sitter-' + crypto.randomUUID().slice(0, 6);
        const types = Array.isArray(body.accepted_pet_types) ? body.accepted_pet_types.join(',') : (body.accepted_pet_types || 'Dog');
        await env.zoelys_db.prepare(`
          INSERT INTO sitters (id, full_name, neighbourhood, experience_years, vet_tech_background, accepted_pet_types, can_handle_anxiety, can_handle_medication, has_outdoor_space, nightly_rate_usd)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, body.full_name, body.neighbourhood,
          Number(body.experience_years) || 1,
          body.vet_tech_background ? 1 : 0,
          types,
          body.can_handle_anxiety ? 1 : 1,
          body.can_handle_medication ? 1 : 0,
          body.has_outdoor_space ? 1 : 0,
          Number(body.nightly_rate_usd) || 60
        ).run();
        return new Response(JSON.stringify({ success: true, sitterId: id }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Sitter application could not be saved' }), { status: 400, headers: corsHeaders });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/sitters') {
      await ensureMatchmaking(env);
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE is_active = 1 ORDER BY full_name ASC`).all();
      return new Response(JSON.stringify({ sitters: results || [] }), { headers: corsHeaders });
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/sitters/')) {
      await ensureMatchmaking(env);
      const id = url.pathname.split('/')[3];
      const sitter = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE id = ? AND is_active = 1`).bind(id).first();
      return new Response(JSON.stringify({ sitter: sitter || null }), { headers: corsHeaders });
    }

    // MATCH ENGINE + RECORDED MATCHES
    if (request.method === 'GET' && url.pathname === '/api/match') {
      await ensureMatchmaking(env);
      const requestId = url.searchParams.get('requestId');
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(requestId).first();
      if (!req) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });

      const { results: sitters } = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE is_active = 1`).all();
      const needs = {
        species: (req.pet_type || '').toLowerCase(),
        meds: /yes/i.test(req.medical_conditions || ''),
        anxiety: /anxiety/i.test(req.behavioral_traits || ''),
        outdoor: /yes/i.test(req.outdoor_space || ''),
        neighbourhood: (req.neighbourhood || '').trim().toLowerCase()
      };

      const matches = (sitters || []).map(s => {
        const reasons = [];
        let score = 0;

        const accepted = (s.accepted_pet_types || '').split(',').map(t => t.trim().toLowerCase());
        if (needs.species && !accepted.includes(needs.species)) return null;

        score += 25; reasons.push('Perfect species match');
        if (needs.neighbourhood && s.neighbourhood.trim().toLowerCase() === needs.neighbourhood) {
          score += 20; reasons.push('In your neighbourhood');
        } else {
          score += 10; reasons.push('Nearby in Miami');
        }
        if (needs.meds && s.can_handle_medication) { score += 15; reasons.push('Confident with medications'); }
        if (needs.anxiety && s.can_handle_anxiety) { score += 10; reasons.push('Calms separation anxiety'); }
        if (needs.outdoor && s.has_outdoor_space) { score += 15; reasons.push('Fenced outdoor space'); }
        else if (!needs.outdoor) { score += 10; reasons.push('Outdoor ready'); }
        if (s.vet_tech_background) { score += 15; reasons.push('Certified vet tech'); }
        else if (s.experience_years >= 5) { score += 12; reasons.push(5 + '+ years experience'); }
        else { score += 8; reasons.push('Experienced caregiver'); }

        score = Math.min(score, 100);
        return { ...s, match_score: score, match_reasons: reasons };
      }).filter(Boolean).sort((a, b) => b.match_score - a.match_score);

      return new Response(JSON.stringify({ matches, request: req }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/matches') {
      await ensureMatchmaking(env);
      const body = await request.json();
      const id = 'mch-' + crypto.randomUUID().slice(0, 6);
      await env.zoelys_db.prepare(`INSERT INTO matches (id, request_id, sitter_id) VALUES (?, ?, ?)`).bind(id, body.request_id, body.sitter_id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true, matchId: id }), { headers: corsHeaders });
    }
    if (request.method === 'GET' && url.pathname === '/api/matches') {
      await ensureMatchmaking(env);
      const requestIds = (url.searchParams.get('requestIds') || '').split(',').filter(Boolean);
      if (!requestIds.length) return new Response(JSON.stringify({ matches: [] }), { headers: corsHeaders });
      const clause = requestIds.map(() => '?').join(',');
      const { results } = await env.zoelys_db.prepare(`SELECT m.id, m.request_id, m.sitter_id, s.full_name AS sitter_name, s.neighbourhood, s.nightly_rate_usd, s.vet_tech_background, r.full_name AS owner_name FROM matches m JOIN sitters s ON s.id = m.sitter_id JOIN client_requests r ON r.id = m.request_id WHERE m.request_id IN (${clause}) ORDER BY m.created_at DESC`).bind(...requestIds).all();
      return new Response(JSON.stringify({ matches: results || [] }), { headers: corsHeaders });
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

    // JOURNAL / POSTS CMS API
    if (request.method === 'GET' && url.pathname === '/api/posts') {
      await ensurePosts(env);
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM posts ORDER BY rowid DESC`).all();
      return new Response(JSON.stringify({ posts: results || [] }), { headers: corsHeaders });
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/posts/')) {
      const slug = decodeURIComponent(url.pathname.split('/')[3]);
      await ensurePosts(env);
      const post = await env.zoelys_db.prepare(`SELECT * FROM posts WHERE slug = ? OR id = ?`).bind(slug, slug).first();
      return new Response(JSON.stringify({ post: post || null }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/posts') {
      const body = await request.json();
      const slug = String(body.slug || body.title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'post';
      const id = 'post-' + crypto.randomUUID().slice(0, 6);
      await ensurePosts(env);
      await env.zoelys_db.prepare(`INSERT INTO posts (id, title, slug, category, author, publish_date, read_time, excerpt, image_url, content, featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .bind(id, body.title, slug, body.category || 'Journal', body.author || 'Zoélys Editorial', body.publish_date || new Date().toISOString().slice(0, 10), body.read_time || '5 min read', body.excerpt || '', body.image_url || '', body.content || '', body.featured ? 1 : 0).run();
      return new Response(JSON.stringify({ success: true, id, slug }), { headers: corsHeaders });
    }
    if (request.method === 'DELETE' && url.pathname.startsWith('/api/posts/')) {
      const key = decodeURIComponent(url.pathname.split('/')[3]);
      await env.zoelys_db.prepare(`DELETE FROM posts WHERE id = ? OR slug = ?`).bind(key, key).run().catch(() => {});
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    const response = await env.ASSETS.fetch(request);
    const newHeaders = new Headers(response.headers);
    newHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers: newHeaders });
  }
};
