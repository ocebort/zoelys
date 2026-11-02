export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('Registration attempt received for body:', JSON.stringify(body));

    const email = body.email ? body.email.trim().toLowerCase() : '';
    const password = body.password ? body.password.trim() : '';
    const full_name = body.full_name || 'Member';
    const tier = body.tier || 'Platinum';
    const role = body.role || 'owner';

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email address.' }), { status: 400 });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'Password must be at least 8 characters.' }), { status: 400 });
    }

    // Ensure users table exists with correct schema
    await env.zoelys_db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE,
        password TEXT,
        full_name TEXT,
        role TEXT,
        tier TEXT,
        verified INTEGER DEFAULT 0
      )
    `).run();

    console.log('Checked/Created users table successfully.');

    // Check if user already exists (case-insensitive)
    const existing = await env.zoelys_db.prepare("SELECT email FROM users WHERE LOWER(email) = ?").bind(email).first();
    if (existing) {
      console.log('Registration blocked: Email already exists:', email);
      return new Response(JSON.stringify({ success: false, error: 'An account with this email already exists.' }), { status: 400 });
    }

    const userId = crypto.randomUUID();
    const verifyToken = crypto.randomUUID();

    // Insert user into D1 database
    console.log('Inserting new user into D1 database...');
    await env.zoelys_db.prepare(
      "INSERT INTO users (id, email, password, full_name, role, tier, verified) VALUES (?, ?, ?, ?, ?, ?, 0)"
    ).bind(userId, email, password, full_name, role, tier).run();

    console.log('User successfully inserted into D1 database!');

    // Send verification email via Resend
    const origin = new URL(request.url).origin;
    const verifyLink = `${origin}/api/auth/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'Zoélys Concierge <onboarding@resend.dev>',
        to: [email],
        subject: 'Welcome to Zoélys — Verify Your Account',
        html: `
          <div style="font-family: Garamond, serif; padding: 32px; background: #FAF8F5; color: #191512; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #EBE6DF;">
            <h2 style="font-size: 26px; font-weight: normal; margin-bottom: 8px;">Welcome to Zoélys, ${full_name}.</h2>
            <p style="font-family: sans-serif; font-size: 14px; color: #666; line-height: 1.6;">Please confirm your email address to activate your membership portal.</p>
            <div style="margin-top: 24px;">
              <a href="${verifyLink}" style="display: inline-block; background: #191512; color: #FAF8F5; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Verify Account &amp; Continue &rarr;</a>
            </div>
          </div>
        `
      })
    });

    if (!resendResponse.ok) {
      const errData = await resendResponse.json();
      console.error('Resend email dispatch failed:', errData);
      return new Response(JSON.stringify({ success: false, error: errData.message || 'Failed to send verification email.' }), { status: 400 });
    }

    console.log('Verification email sent successfully.');
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('CRITICAL REGISTRATION EXCEPTION:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
