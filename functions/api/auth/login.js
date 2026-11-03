export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    console.log('Login attempt received for email:', body.email);

    const email = body.email ? body.email.trim().toLowerCase() : '';
    const password = body.password;

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter your email and password.' }), { status: 400 });
    }

    // Query D1 database using LOWER() for case-insensitive matching
    const { results } = await env.zoelys_db.prepare(
      "SELECT * FROM users WHERE LOWER(email) = ?"
    ).bind(email).all();

    console.log('Database query results count:', results ? results.length : 0);

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No account found with this email address.' }), { status: 404 });
    }

    const user = results[0];

    if (user.password !== password) {
      return new Response(JSON.stringify({ success: false, error: 'Incorrect password. Please try again.' }), { status: 401 });
    }

    // Détermination dynamique de l'URL de redirection en gérant 'pet_sitter', 'sitter', etc.
    let redirectUrl = '/dashboard/owner/';
    const userRole = user.role ? user.role.toLowerCase() : '';
    
    if (userRole.includes('sitter') || userRole.includes('caregiver') || userRole === 'pet_sitter') {
      redirectUrl = '/dashboard/sitters/';
    }

    return new Response(JSON.stringify({ 
      success: true, 
      redirectUrl: redirectUrl,
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Login error exception:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
