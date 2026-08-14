let postsBootstrapped = false;

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
