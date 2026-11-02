export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, password, full_name, tier, role } = await request.json();

    // 1. Generate unique verification token
    const verifyToken = crypto.randomUUID();

    // 2. Build verification URL
    const origin = new URL(request.url).origin;
    const verifyLink = `${origin}/api/auth/verify?token=${verifyToken}&email=${encodeURIComponent(email)}`;

    // 3. Send email using Resend API
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

    if (resendResponse.ok) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else {
      const errData = await resendResponse.json();
      return new Response(JSON.stringify({ success: false, error: errData.message || 'Failed to dispatch email.' }), { status: 500 });
    }

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
