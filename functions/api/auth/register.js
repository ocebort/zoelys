export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { email, password, full_name, tier, role } = body;

    // 1. Detailed Field Validations
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Validation Error: Please enter a valid email address.' }), { status: 400 });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'Validation Error: Password must be at least 8 characters long.' }), { status: 400 });
    }

    if (!full_name || full_name.trim().length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'Validation Error: Please enter your full name.' }), { status: 400 });
    }

    // 2. Check D1 Database for existing user safely
    if (env.zoelys_db) {
      try {
        const existingUser = await env.zoelys_db.prepare("SELECT id FROM users WHERE email = ?").bind(email.toLowerCase()).first();
        if (existingUser) {
          return new Response(JSON.stringify({ success: false, error: 'An account with this email address already exists. Please sign in instead.' }), { status: 400 });
        }
      } catch (dbErr) {
        console.log("D1 Table Check Note:", dbErr.message);
      }
    }

    // 3. Ensure Resend API Key exists
    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Server Configuration Error: RESEND_API_KEY secret is missing on Cloudflare.' }), { status: 500 });
    }

    // 4. Generate token and dispatch email via Resend
    const verifyToken = crypto.randomUUID();
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
          <div style="font-family: 'Garamond', serif; padding: 32px; background: #FAF8F5; color: #191512; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #EBE6DF;">
            <h2 style="font-size: 26px; font-weight: normal; margin-bottom: 8px;">Welcome to Zoélys, ${full_name}.</h2>
            <p style="font-family: sans-serif; font-size: 14px; color: #666; line-height: 1.6;">Please confirm your email address to activate your membership portal and complete your pet profile onboarding briefing.</p>
            <div style="margin-top: 24px;">
              <a href="${verifyLink}" style="display: inline-block; background: #191512; color: #FAF8F5; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-family: sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase;">Verify Account &amp; Continue &rarr;</a>
            </div>
          </div>
        `
      })
    });

    const resendData = await resendResponse.json();

    if (resendResponse.ok) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      console.log("Resend Dispatch Error:", JSON.stringify(resendData));
      return new Response(JSON.stringify({ 
        success: false, 
        error: resendData.message || 'Email dispatch failed via Resend.' 
      }), { status: 400 });
    }

  } catch (err) {
    console.log("Critical Registration Error:", err.message);
    return new Response(JSON.stringify({ success: false, error: 'Registration failed. Server exception: ' + err.message }), { status: 500 });
  }
}
