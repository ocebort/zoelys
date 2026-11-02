export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, password, full_name, tier, role } = await request.json();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ success: false, error: 'Validation Error: Invalid email.' }), { status: 400 });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ success: false, error: 'Validation Error: Password must be at least 8 characters.' }), { status: 400 });
    }

    if (!env.RESEND_API_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Server Error: RESEND_API_KEY secret missing.' }), { status: 500 });
    }

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
          <div style="font-family: Garamond, serif; padding: 32px; background: #FAF8F5; color: #191512; max-width: 500px; margin: 0 auto; border-radius: 12px; border: 1px solid #EBE6DF;">
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
      return new Response(JSON.stringify({ success: true, id: resendData.id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ success: false, error: resendData.message || 'Resend email dispatch failed.' }), { status: 400 });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
