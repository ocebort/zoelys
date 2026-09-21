let postsBootstrapped = false;
let matchmakingBootstrapped = false;

async function memberFromRequest(env, url) {
  const key = (url.searchParams.get('userId') || '').trim();
  if (!key) return null;
  const user = await env.zoelys_db.prepare(`SELECT id, email, full_name, subscription_tier, credit_balance FROM users WHERE id = ?`).bind(key).first();
  if (!user) return null;
  const role = String(user.id).startsWith('sit-') || user.subscription_tier === 'Vetted Sitter' ? 'sitter' : 'owner';
  const is_admin = user.email && user.email.toLowerCase() === 'ocebort@gmail.com' ? 1 : 0;
  return { ...user, role, is_admin };
}

async function computeMatches(env, req) {
  const { results: sitters } = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE is_active = 1`).all();
  const needs = {
    species: (req.pet_type || '').toLowerCase(),
    meds: /yes/i.test(req.medical_conditions || ''),
    anxiety: /anxiety/i.test(req.behavioral_traits || ''),
    outdoor: /yes/i.test(req.outdoor_space || ''),
    neighbourhood: (req.neighbourhood || '').trim().toLowerCase()
  };
  const budgetMax = parseBudget(req.budget_range);
  return (sitters || []).map(s => {
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

    if (budgetMax != null) {
      if (Number(s.nightly_rate_usd) <= budgetMax) {
        score += 10; reasons.push('Within your budget');
      } else {
        score -= 8; reasons.push('Above your budget range');
      }
    }

    score = Math.max(0, Math.min(score, 100));
    return { ...s, match_score: score, match_reasons: reasons };
  }).filter(Boolean).sort((a, b) => b.match_score - a.match_score);
}

function parseBudget(range) {
  const r = (range || '').toLowerCase();
  if (/under\s*\$?50/.test(r)) return 50;
  if (/\$50/.test(r) && /\$99/.test(r)) return 99;
  if (/\$100/.test(r) && /\$149/.test(r)) return 149;
  return null;
}

function creditCostForBudget(range) {
  const r = (range || '').toLowerCase();
  if (/under\s*\$?50/.test(r)) return 1;
  if (/\$150\s*\+|over\s*\$?150/.test(r)) return 3;
  return 2;
}

function nightsFor(start, end) {
  if (!start) return 1;
  const d1 = new Date(start + 'T12:00:00Z');
  const d2 = end ? new Date(end + 'T12:00:00Z') : new Date(d1.getTime() + 86400000);
  const days = Math.round((d2 - d1) / 86400000);
  return Math.max(1, days + 1);
}

async function creditWallet(env, matchId) {
  const match = await env.zoelys_db.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
  if (!match || Number(match.earnings || 0) > 0) return;
  const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(match.request_id).first();
  const sitter = await env.zoelys_db.prepare(`SELECT nightly_rate_usd FROM sitters WHERE id = ?`).bind(match.sitter_id).first();
  if (!req || !sitter) return;
  const earnings = Number(sitter.nightly_rate_usd || 0) * nightsFor(req.start_date, req.end_date);
  await env.zoelys_db.prepare(`UPDATE matches SET earnings = ? WHERE id = ?`).bind(earnings, matchId).run().catch(() => {});
  await env.zoelys_db.prepare(`INSERT INTO sitter_wallets (id, sitter_id, available, withdrawn) VALUES (?, ?, 0, 0) ON CONFLICT (sitter_id) DO NOTHING`).bind('wl-' + crypto.randomUUID().slice(0, 6), match.sitter_id).run().catch(() => {});
  await env.zoelys_db.prepare(`UPDATE sitter_wallets SET available = available + ? WHERE sitter_id = ?`).bind(earnings, match.sitter_id).run().catch(() => {});
  await env.zoelys_db.prepare(`INSERT INTO wallet_txns (id, sitter_id, match_id, kind, amount, note) VALUES (?, ?, ?, 'earning', ?, ?)`).bind('txn-' + crypto.randomUUID().slice(0, 6), match.sitter_id, matchId, earnings, `Sitting payout: ${req.pet_name || 'pet care'}`).run().catch(() => {});
}

function matchParticipant(env, member, match) {
  return env.zoelys_db.prepare(`SELECT full_name FROM sitters WHERE id = ?`).bind(match.sitter_id).first().then(s => {
    const isSitter = s && String(member.full_name || '').toLowerCase() === String(s.full_name || '').toLowerCase();
    if (member.is_admin || isSitter) return true;
    return env.zoelys_db.prepare(`SELECT email FROM client_requests WHERE id = ?`).bind(match.request_id).first().then(req =>
      !!req && String(req.email || '').toLowerCase() === String(member.email || '').toLowerCase()
    );
  });
}

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
    experience_level TEXT,
    status TEXT DEFAULT 'matching'
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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'proposed',
    match_score INTEGER DEFAULT 0,
    match_reasons TEXT DEFAULT '[]'
  )`).run();

  await env.zoelys_db.prepare(`ALTER TABLE client_requests ADD COLUMN status TEXT DEFAULT 'matching'`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE matches ADD COLUMN status TEXT DEFAULT 'proposed'`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE matches ADD COLUMN match_score INTEGER DEFAULT 0`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE matches ADD COLUMN match_reasons TEXT DEFAULT '[]'`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE client_requests ADD COLUMN budget_range TEXT DEFAULT ''`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE matches ADD COLUMN earnings REAL DEFAULT 0`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE sitters ADD COLUMN tagline TEXT DEFAULT ''`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE sitters ADD COLUMN bio TEXT DEFAULT ''`).run().catch(() => {});
  await env.zoelys_db.prepare(`ALTER TABLE sitters ADD COLUMN gallery TEXT DEFAULT '[]'`).run().catch(() => {});

  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS sitter_wallets (
    id TEXT PRIMARY KEY,
    sitter_id TEXT NOT NULL UNIQUE,
    available REAL DEFAULT 0,
    withdrawn REAL DEFAULT 0
  )`).run();
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS wallet_txns (
    id TEXT PRIMARY KEY,
    sitter_id TEXT NOT NULL,
    match_id TEXT,
    kind TEXT NOT NULL,
    amount REAL NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS care_profiles (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL UNIQUE,
    feed_schedule TEXT DEFAULT '',
    diet TEXT DEFAULT '',
    meds TEXT DEFAULT '',
    vet_name TEXT DEFAULT '',
    vet_phone TEXT DEFAULT '',
    quirks TEXT DEFAULT '',
    house_rules TEXT DEFAULT '',
    emergency_phone TEXT DEFAULT '',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`).run();
  await env.zoelys_db.prepare(`CREATE TABLE IF NOT EXISTS care_logs (
    id TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    log_date TEXT DEFAULT '',
    meals TEXT DEFAULT '',
    walks TEXT DEFAULT '',
    meds_given TEXT DEFAULT '',
    notes TEXT DEFAULT '',
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
        const member = await memberFromRequest(env, url);
        if (!member) return new Response(JSON.stringify({ error: 'Members only — sign in to begin' }), { status: 401, headers: corsHeaders });
        const body = await request.json();
        const cost = creditCostForBudget(body.budget_range);
        const balance = Number(member.credit_balance || 0);
        if (balance < cost) {
          return new Response(JSON.stringify({ error: 'Not enough credits for this request', required: cost, balance }), { status: 402, headers: corsHeaders });
        }
        const id = 'req-' + crypto.randomUUID().slice(0, 8);
        await env.zoelys_db.prepare(`
          INSERT INTO client_requests (id, full_name, email, neighbourhood, pet_type, pet_name, breed, behavioral_traits, medical_conditions, exercise_needs, service_type, start_date, end_date, outdoor_space, experience_level, status, budget_range)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          body.full_name, member.email, body.neighbourhood,
          body.pet_type, body.pet_name, body.breed,
          body.behavioral_traits, body.medical_conditions, body.exercise_needs,
          body.service_type, body.start_date, body.end_date,
          body.outdoor_space, body.experience_level,
          'pending',
          body.budget_range || ''
        ).run();
        const newBalance = balance - cost;
        await env.zoelys_db.prepare(`UPDATE users SET credit_balance = ? WHERE id = ?`).bind(newBalance, member.id).run();
        return new Response(JSON.stringify({ success: true, requestId: id, status: 'pending', credits_charged: cost, balance: newBalance }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Request could not be saved' }), { status: 400, headers: corsHeaders });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/requests') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const email = member.is_admin
        ? (url.searchParams.get('email') || '').trim().toLowerCase()
        : member.email.toLowerCase();
      const { results } = email
        ? await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE LOWER(TRIM(email)) = ? ORDER BY created_at DESC`).bind(email).all()
        : await env.zoelys_db.prepare(`SELECT * FROM client_requests ORDER BY created_at DESC`).all();
      return new Response(JSON.stringify({ requests: results || [] }), { headers: corsHeaders });
    }

    // ADMIN: accept a client request — compute, record and reveal her handpicked matches
    if (request.method === 'POST' && url.pathname.startsWith('/api/requests/') && url.pathname.endsWith('/approve')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member || !member.is_admin) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(id).first();
      if (!req) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });
      if (['confirmed', 'in_care', 'completed'].includes(req.status)) {
        return new Response(JSON.stringify({ error: 'This request has already moved past proposal' }), { status: 400, headers: corsHeaders });
      }
      const scored = await computeMatches(env, req);
      for (const m of scored) {
        await env.zoelys_db.prepare(`INSERT INTO matches (id, request_id, sitter_id, status, match_score, match_reasons) VALUES (?, ?, ?, ?, ?, ?)`).bind('mch-' + crypto.randomUUID().slice(0, 6), id, m.id, 'proposed', m.match_score, JSON.stringify(m.match_reasons)).run().catch(() => {});
      }
      await env.zoelys_db.prepare(`UPDATE client_requests SET status = 'proposed' WHERE id = ?`).bind(id).run();
      return new Response(JSON.stringify({ success: true, requestId: id, matched: scored.map(m => m.id), matches: scored }), { headers: corsHeaders });
    }

    // ADMIN: decline a client request (e.g. no fit available yet)
    if (request.method === 'POST' && url.pathname.startsWith('/api/requests/') && url.pathname.endsWith('/decline')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member || !member.is_admin) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`UPDATE client_requests SET status = 'not_accepted' WHERE id = ?`).bind(id).run();
      return new Response(JSON.stringify({ success: true, requestId: id, status: 'not_accepted' }), { headers: corsHeaders });
    }

    // SITTERS ROSTER API
    if (request.method === 'POST' && url.pathname === '/api/sitters') {
      try {
        await ensureMatchmaking(env);
        const body = await request.json();
        const id = 'sitter-' + crypto.randomUUID().slice(0, 6);
        const types = Array.isArray(body.accepted_pet_types) ? body.accepted_pet_types.join(',') : (body.accepted_pet_types || 'Dog');
        await env.zoelys_db.prepare(`
          INSERT INTO sitters (id, full_name, neighbourhood, experience_years, vet_tech_background, accepted_pet_types, can_handle_anxiety, can_handle_medication, has_outdoor_space, nightly_rate_usd, is_active)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id, body.full_name, body.neighbourhood,
          Number(body.experience_years) || 1,
          body.vet_tech_background ? 1 : 0,
          types,
          body.can_handle_anxiety ? 1 : 0,
          body.can_handle_medication ? 1 : 0,
          body.has_outdoor_space ? 1 : 0,
          Number(body.nightly_rate_usd) || 60,
          0
        ).run();
        return new Response(JSON.stringify({ success: true, sitterId: id, status: 'pending' }), { headers: corsHeaders });
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Sitter application could not be saved' }), { status: 400, headers: corsHeaders });
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/sitters') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      if (member.is_admin) {
        const { results } = await env.zoelys_db.prepare(`SELECT * FROM sitters ORDER BY is_active DESC, full_name ASC`).all();
        return new Response(JSON.stringify({ sitters: results || [] }), { headers: corsHeaders });
      }
      const { results } = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE is_active = 1 ORDER BY full_name ASC`).all();
      return new Response(JSON.stringify({ sitters: results || [] }), { headers: corsHeaders });
    }
    if (request.method === 'GET' && url.pathname.startsWith('/api/sitters/')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      const sql = member.is_admin
        ? `SELECT * FROM sitters WHERE id = ?`
        : `SELECT * FROM sitters WHERE id = ? AND is_active = 1`;
      const sitter = await env.zoelys_db.prepare(sql).bind(id).first();
      return new Response(JSON.stringify({ sitter: sitter || null }), { headers: corsHeaders });
    }

    // MATCH ENGINE + RECORDED MATCHES
    if (request.method === 'GET' && url.pathname === '/api/match') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      if (!member.is_admin) return new Response(JSON.stringify({ error: 'Concierge preview only' }), { status: 403, headers: corsHeaders });
      const requestId = url.searchParams.get('requestId');
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(requestId).first();
      if (!req) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });
      if (!member.is_admin && req.email.toLowerCase() !== member.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'This request belongs to another member' }), { status: 403, headers: corsHeaders });
      }

      const matches = await computeMatches(env, req);
      return new Response(JSON.stringify({ matches, request: req }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/matches') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const body = await request.json();
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(body.request_id).first();
      if (!req) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });
      if (!member.is_admin && req.email.toLowerCase() !== member.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'This request belongs to another member' }), { status: 403, headers: corsHeaders });
      }
      const id = 'mch-' + crypto.randomUUID().slice(0, 6);
      await env.zoelys_db.prepare(`INSERT INTO matches (id, request_id, sitter_id, status) VALUES (?, ?, ?, ?)`).bind(id, body.request_id, body.sitter_id, 'proposed').run().catch(() => {});
      await env.zoelys_db.prepare(`UPDATE client_requests SET status = 'proposed' WHERE id = ? AND status IN ('matching', 'declined')`).bind(body.request_id).run().catch(() => {});
      return new Response(JSON.stringify({ success: true, matchId: id, status: 'proposed' }), { headers: corsHeaders });
    }
    if (request.method === 'GET' && url.pathname === '/api/matches') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      let requestIds = (url.searchParams.get('requestIds') || '').split(',').filter(Boolean);
      if (!member.is_admin && requestIds.length) {
        const { results: own = [] } = await env.zoelys_db.prepare(`SELECT id FROM client_requests WHERE LOWER(TRIM(email)) = ?`).bind(member.email.toLowerCase()).all();
        const ownSet = new Set(own.map(r => r.id));
        requestIds = requestIds.filter(id => ownSet.has(id));
      }
      if (!requestIds.length) return new Response(JSON.stringify({ matches: [] }), { headers: corsHeaders });
      const clause = requestIds.map(() => '?').join(',');
      const { results } = await env.zoelys_db.prepare(`SELECT m.id, m.request_id, m.sitter_id, m.status, s.full_name AS sitter_name, s.neighbourhood, s.nightly_rate_usd, s.vet_tech_background, r.full_name AS owner_name FROM matches m JOIN sitters s ON s.id = m.sitter_id JOIN client_requests r ON r.id = m.request_id WHERE m.request_id IN (${clause}) ORDER BY m.created_at DESC`).bind(...requestIds).all();
      return new Response(JSON.stringify({ matches: results || [] }), { headers: corsHeaders });
    }

    // OWNER JOURNEY TRACKER (status pipeline for one member)
    if (request.method === 'GET' && url.pathname === '/api/journey') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const { results: requests = [] } = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE LOWER(TRIM(email)) = ? ORDER BY created_at DESC`).bind(member.email.toLowerCase()).all();
      const tracked = [];
      for (const r of requests) {
        const { results: mch = [] } = await env.zoelys_db.prepare(`SELECT m.id, m.sitter_id, m.status, m.match_score, m.match_reasons, m.created_at, s.full_name, s.neighbourhood, s.nightly_rate_usd, s.vet_tech_background, s.experience_years FROM matches m JOIN sitters s ON s.id = m.sitter_id WHERE m.request_id = ? ORDER BY m.created_at DESC`).bind(r.id).all();
        tracked.push({ ...r, status: r.status || 'pending', matches: mch });
      }
      return new Response(JSON.stringify({ requests: tracked }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/journey/status') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const body = await request.json();
      const allowed = ['proposed', 'confirmed', 'accepted', 'in_care', 'completed', 'declined'];
      const status = String(body.status || '').toLowerCase();
      if (!allowed.includes(status)) return new Response(JSON.stringify({ error: 'Unknown status' }), { status: 400, headers: corsHeaders });
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(body.request_id).first();
      if (!req) return new Response(JSON.stringify({ error: 'Request not found' }), { status: 404, headers: corsHeaders });
      if (!member.is_admin && req.email.toLowerCase() !== member.email.toLowerCase()) {
        return new Response(JSON.stringify({ error: 'Not your request' }), { status: 403, headers: corsHeaders });
      }
      await env.zoelys_db.prepare(`UPDATE client_requests SET status = ? WHERE id = ?`).bind(status, body.request_id).run();
      const matchesToUpdate = status === 'declined'
        ? ['proposed', 'confirmed', 'accepted']
        : ['proposed', 'confirmed', 'accepted'];
      await env.zoelys_db.prepare(`UPDATE matches SET status = ? WHERE request_id = ? AND status IN ('proposed', 'confirmed', 'accepted')`).bind(status, body.request_id).run().catch(() => {});
      if (['accepted', 'in_care', 'completed'].includes(status)) {
        const { results: all = [] } = await env.zoelys_db.prepare(`SELECT id FROM matches WHERE request_id = ?`).bind(body.request_id).all();
        for (const m of all) await creditWallet(env, m.id);
      }
      return new Response(JSON.stringify({ success: true, status }), { headers: corsHeaders });
    }

    // SITTER ACCEPTS OR DECLINES A SITTING (third gate in the chain)
    if (request.method === 'POST' && url.pathname.startsWith('/api/matches/')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const parts = url.pathname.split('/');
      const matchId = parts[3];
      const action = parts[4];
      if (!['accept', 'sitter-decline'].includes(action)) {
        return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders });
      }
      const match = await env.zoelys_db.prepare(`SELECT * FROM matches WHERE id = ?`).bind(matchId).first();
      if (!match) return new Response(JSON.stringify({ error: 'Match not found' }), { status: 404, headers: corsHeaders });
      if (!(await matchParticipant(env, member, match))) {
        return new Response(JSON.stringify({ error: 'Not your sitting' }), { status: 403, headers: corsHeaders });
      }
      if (action === 'accept') {
        if (match.status !== 'confirmed') {
          return new Response(JSON.stringify({ error: `This sitting is currently ${match.status}; it can only be accepted after the owner confirms.` }), { status: 400, headers: corsHeaders });
        }
        const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(match.request_id).first();
        await env.zoelys_db.prepare(`UPDATE matches SET status = 'accepted' WHERE id = ?`).bind(matchId).run();
        if (req && req.status === 'confirmed') {
          await env.zoelys_db.prepare(`UPDATE client_requests SET status = 'accepted' WHERE id = ?`).bind(match.request_id).run();
        }
        await creditWallet(env, matchId);
        const earnings = (await env.zoelys_db.prepare(`SELECT earnings FROM matches WHERE id = ?`).bind(matchId).first()) || {};
        return new Response(JSON.stringify({ success: true, status: 'accepted', earnings: Number(earnings.earnings || 0) }), { headers: corsHeaders });
      }
      await env.zoelys_db.prepare(`UPDATE matches SET status = 'sitter_declined' WHERE id = ?`).bind(matchId).run();
      const req = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(match.request_id).first();
      if (req && req.status === 'accepted') {
        await env.zoelys_db.prepare(`UPDATE client_requests SET status = 'confirmed' WHERE id = ?`).bind(match.request_id).run();
      }
      return new Response(JSON.stringify({ success: true, status: 'sitter_declined' }), { headers: corsHeaders });
    }

    // SITTER WALLET (Vinted-style: money lands on accept, withdraw anytime)
    if (request.method === 'GET' && url.pathname === '/api/wallet') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const { results: sitters = [] } = await env.zoelys_db.prepare(`SELECT * FROM sitters`).all();
      const profile = sitters.find(s => (s.full_name || '').toLowerCase() === (member.full_name || '').toLowerCase());
      if (member.is_admin) {
        const { results: wallets = [] } = await env.zoelys_db.prepare(`SELECT w.*, s.full_name FROM sitter_wallets w LEFT JOIN sitters s ON s.id = w.sitter_id ORDER BY w.available DESC`).all();
        return new Response(JSON.stringify({ wallets: wallets || [] }), { headers: corsHeaders });
      }
      if (!profile) return new Response(JSON.stringify({ error: 'Only caregivers have a wallet' }), { status: 403, headers: corsHeaders });
      const wallet = await env.zoelys_db.prepare(`SELECT * FROM sitter_wallets WHERE sitter_id = ?`).bind(profile.id).first();
      const { results: txns = [] } = await env.zoelys_db.prepare(`SELECT * FROM wallet_txns WHERE sitter_id = ? ORDER BY created_at DESC`).bind(profile.id).all();
      const { results: acts = [] } = await env.zoelys_db.prepare(`SELECT m.id AS match_id, m.status, m.earnings, r.pet_name, r.start_date, r.end_date, s.nightly_rate_usd FROM matches m JOIN client_requests r ON r.id = m.request_id JOIN sitters s ON s.id = m.sitter_id WHERE m.sitter_id = ? AND m.status IN ('accepted','in_care','completed') ORDER BY m.created_at DESC`).bind(profile.id).all();
      return new Response(JSON.stringify({
        wallet: { sitter_id: profile.id, available: Number(wallet ? wallet.available : 0), withdrawn: Number(wallet ? wallet.withdrawn : 0) },
        txns: txns || [],
        active_sits: acts || []
      }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/wallet/withdraw') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      if (member.is_admin) return new Response(JSON.stringify({ error: 'Admins cannot withdraw' }), { status: 403, headers: corsHeaders });
      const { results: sitters = [] } = await env.zoelys_db.prepare(`SELECT * FROM sitters`).all();
      const profile = sitters.find(s => (s.full_name || '').toLowerCase() === (member.full_name || '').toLowerCase());
      if (!profile) return new Response(JSON.stringify({ error: 'Only caregivers have a wallet' }), { status: 403, headers: corsHeaders });
      const body = await request.json();
      const amount = Number(body.amount || 0);
      if (!(amount > 0)) return new Response(JSON.stringify({ error: 'Enter a valid amount' }), { status: 400, headers: corsHeaders });
      const wallet = await env.zoelys_db.prepare(`SELECT * FROM sitter_wallets WHERE sitter_id = ?`).bind(profile.id).first();
      const available = Number(wallet ? wallet.available : 0);
      if (amount > available) return new Response(JSON.stringify({ error: 'Not enough available balance', available }), { status: 400, headers: corsHeaders });
      if (!wallet) {
        await env.zoelys_db.prepare(`INSERT INTO sitter_wallets (id, sitter_id, available, withdrawn) VALUES (?, ?, 0, 0)`).bind('wl-' + crypto.randomUUID().slice(0, 6), profile.id).run().catch(() => {});
      }
      await env.zoelys_db.prepare(`UPDATE sitter_wallets SET available = available - ?, withdrawn = withdrawn + ? WHERE sitter_id = ?`).bind(amount, amount, profile.id).run();
      await env.zoelys_db.prepare(`INSERT INTO wallet_txns (id, sitter_id, kind, amount, note) VALUES (?, ?, 'withdrawal', ?, 'Withdrawal requested')`).bind('txn-' + crypto.randomUUID().slice(0, 6), profile.id, amount).run();
      return new Response(JSON.stringify({ success: true, withdrawn: amount, balance: available - amount }), { headers: corsHeaders });
    }

    // CREDITS (owner balance + admin credit bank)
    if (request.method === 'GET' && url.pathname === '/api/credits') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      if (member.is_admin) {
        const { results = [] } = await env.zoelys_db.prepare(`SELECT u.id, u.email, u.full_name, u.subscription_tier, u.credit_balance, (SELECT COUNT(*) FROM client_requests r WHERE LOWER(TRIM(r.email)) = LOWER(TRIM(u.email))) AS requests_count FROM users u ORDER BY u.credit_balance DESC`).all();
        return new Response(JSON.stringify({ accounts: results || [] }), { headers: corsHeaders });
      }
      const row = await env.zoelys_db.prepare(`SELECT credit_balance, subscription_tier FROM users WHERE id = ?`).bind(member.id).first();
      return new Response(JSON.stringify({ credits: row || { credit_balance: 0, subscription_tier: '' } }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/credits/top-up') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member || !member.is_admin) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
      const body = await request.json();
      const amount = Number(body.amount);
      if (!(amount > 0)) return new Response(JSON.stringify({ error: 'Enter a valid amount' }), { status: 400, headers: corsHeaders });
      let targetId = body.user_id;
      if (!targetId && body.email) {
        const byEmail = await env.zoelys_db.prepare(`SELECT id FROM users WHERE LOWER(TRIM(email)) = ?`).bind(String(body.email || '').toLowerCase()).first();
        if (!byEmail) return new Response(JSON.stringify({ error: 'No member with that email' }), { status: 404, headers: corsHeaders });
        targetId = byEmail.id;
      }
      if (!targetId) return new Response(JSON.stringify({ error: 'Provide a member id or email' }), { status: 400, headers: corsHeaders });
      await env.zoelys_db.prepare(`UPDATE users SET credit_balance = credit_balance + ? WHERE id = ?`).bind(amount, targetId).run();
      const updated = await env.zoelys_db.prepare(`SELECT credit_balance FROM users WHERE id = ?`).bind(targetId).first();
      return new Response(JSON.stringify({ success: true, balance: updated ? updated.credit_balance : null }), { headers: corsHeaders });
    }

    // CARE PROFILE + DAILY LOGS (sitter dashboards)
    if (request.method === 'GET' && url.pathname === '/api/care') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const matchId = url.searchParams.get('matchId');
      const match = await env.zoelys_db.prepare(`SELECT m.*, s.full_name AS sitter_name, r.pet_name, r.pet_type, r.breed, r.full_name AS owner_name, r.start_date, r.end_date, r.medical_conditions, r.behavioral_traits, r.service_type FROM matches m JOIN sitters s ON s.id = m.sitter_id JOIN client_requests r ON r.id = m.request_id WHERE m.id = ?`).bind(matchId).first();
      if (!match) return new Response(JSON.stringify({ error: 'Sitting not found' }), { status: 404, headers: corsHeaders });
      if (!(await matchParticipant(env, member, { request_id: match.request_id, sitter_id: match.sitter_id }))) {
        return new Response(JSON.stringify({ error: 'Not your sitting' }), { status: 403, headers: corsHeaders });
      }
      const care = await env.zoelys_db.prepare(`SELECT * FROM care_profiles WHERE match_id = ?`).bind(matchId).first();
      const { results: logs = [] } = await env.zoelys_db.prepare(`SELECT * FROM care_logs WHERE match_id = ? ORDER BY created_at DESC`).bind(matchId).all();
      return new Response(JSON.stringify({ match, care_profile: care || null, logs: logs || [] }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/care') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const body = await request.json();
      const match = await env.zoelys_db.prepare(`SELECT * FROM matches WHERE id = ?`).bind(body.match_id).first();
      if (!match) return new Response(JSON.stringify({ error: 'Sitting not found' }), { status: 404, headers: corsHeaders });
      if (!(await matchParticipant(env, member, match))) {
        return new Response(JSON.stringify({ error: 'Not your sitting' }), { status: 403, headers: corsHeaders });
      }
      if (member.role !== 'sitter' && !member.is_admin) {
        return new Response(JSON.stringify({ error: 'Only the caregiver keeps the care profile' }), { status: 403, headers: corsHeaders });
      }
      const fields = ['feed_schedule', 'diet', 'meds', 'vet_name', 'vet_phone', 'quirks', 'house_rules', 'emergency_phone'];
      const existing = await env.zoelys_db.prepare(`SELECT id FROM care_profiles WHERE match_id = ?`).bind(body.match_id).first();
      if (existing) {
        await env.zoelys_db.prepare(`UPDATE care_profiles SET feed_schedule = ?, diet = ?, meds = ?, vet_name = ?, vet_phone = ?, quirks = ?, house_rules = ?, emergency_phone = ?, updated_at = CURRENT_TIMESTAMP WHERE match_id = ?`)
          .bind(body.feed_schedule || '', body.diet || '', body.meds || '', body.vet_name || '', body.vet_phone || '', body.quirks || '', body.house_rules || '', body.emergency_phone || '', body.match_id).run();
      } else {
        await env.zoelys_db.prepare(`INSERT INTO care_profiles (id, match_id, feed_schedule, diet, meds, vet_name, vet_phone, quirks, house_rules, emergency_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .bind('care-' + crypto.randomUUID().slice(0, 6), body.match_id, body.feed_schedule || '', body.diet || '', body.meds || '', body.vet_name || '', body.vet_phone || '', body.quirks || '', body.house_rules || '', body.emergency_phone || '').run();
      }
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname === '/api/care/log') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const body = await request.json();
      const match = await env.zoelys_db.prepare(`SELECT * FROM matches WHERE id = ?`).bind(body.match_id).first();
      if (!match) return new Response(JSON.stringify({ error: 'Sitting not found' }), { status: 404, headers: corsHeaders });
      if (!(await matchParticipant(env, member, match))) {
        return new Response(JSON.stringify({ error: 'Not your sitting' }), { status: 403, headers: corsHeaders });
      }
      if (member.role !== 'sitter' && !member.is_admin) {
        return new Response(JSON.stringify({ error: 'Only the caregiver logs daily care' }), { status: 403, headers: corsHeaders });
      }
      await env.zoelys_db.prepare(`INSERT INTO care_logs (id, match_id, log_date, meals, walks, meds_given, notes) VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind('cl-' + crypto.randomUUID().slice(0, 6), body.match_id, body.log_date || '', body.meals || '', body.walks || '', body.meds_given || '', body.notes || '').run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // SITTER PROFILE UPDATE (bio, tagline, photo gallery) — own profile only, or admin
    if (request.method === 'POST' && url.pathname.startsWith('/api/sitters/') && url.pathname.endsWith('/update')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      const sitter = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE id = ?`).bind(id).first();
      if (!sitter) return new Response(JSON.stringify({ error: 'Sitter not found' }), { status: 404, headers: corsHeaders });
      const isSelf = (sitter.full_name || '').toLowerCase() === (member.full_name || '').toLowerCase();
      if (!member.is_admin && !isSelf) return new Response(JSON.stringify({ error: 'You can only edit your own profile' }), { status: 403, headers: corsHeaders });
      const body = await request.json();
      const gallery = Array.isArray(body.gallery) ? JSON.stringify(body.gallery.filter(Boolean)) : (body.gallery || '[]');
      await env.zoelys_db.prepare(`UPDATE sitters SET tagline = ?, bio = ?, gallery = ? WHERE id = ?`)
        .bind(body.tagline || '', body.bio || '', gallery, id).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }

    // SITTER PIPELINE (their roster profile, application status + incoming requests)
    if (request.method === 'GET' && url.pathname === '/api/sitter/pipeline') {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member) return new Response(JSON.stringify({ error: 'Members only' }), { status: 401, headers: corsHeaders });
      const { results: all = [] } = await env.zoelys_db.prepare(`SELECT * FROM sitters ORDER BY rowid ASC`).all();
      const profile = all.find(s => (s.full_name || '').toLowerCase() === (member.full_name || '').toLowerCase()) || all.find(s => (s.full_name || '').toLowerCase().includes((member.full_name || '').toLowerCase())) || null;
      const incoming = [];
      if (profile) {
        const { results: rows = [] } = await env.zoelys_db.prepare(`SELECT m.id AS match_id, m.status AS match_status, m.created_at, r.* , r.full_name AS owner_name FROM matches m JOIN client_requests r ON r.id = m.request_id WHERE m.sitter_id = ? ORDER BY m.created_at DESC`).bind(profile.id).all();
        incoming.push(...rows);
      }
      return new Response(JSON.stringify({
        profile: profile ? { ...profile, application_status: profile.is_active ? 'active' : 'pending' } : null,
        incoming
      }), { headers: corsHeaders });
    }

    // ADMIN: approve / deactivate a sitter application
    if (request.method === 'POST' && url.pathname.startsWith('/api/sitters/') && url.pathname.endsWith('/approve')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member || !member.is_admin) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`UPDATE sitters SET is_active = 1 WHERE id = ?`).bind(id).run();
      return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    }
    if (request.method === 'POST' && url.pathname.startsWith('/api/sitters/') && url.pathname.endsWith('/reject')) {
      await ensureMatchmaking(env);
      const member = await memberFromRequest(env, url);
      if (!member || !member.is_admin) return new Response(JSON.stringify({ error: 'Admin only' }), { status: 403, headers: corsHeaders });
      const id = url.pathname.split('/')[3];
      await env.zoelys_db.prepare(`DELETE FROM sitters WHERE id = ?`).bind(id).run();
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
