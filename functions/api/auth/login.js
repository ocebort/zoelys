export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { email, password, role } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Please enter your email and password.' }), { status: 400 });
    }

    // Query D1 database for user
    const { results } = await env.zoelys_db.prepare(
      "SELECT * FROM users WHERE email = ?"
    ).bind(email).all();

    if (!results || results.length === 0) {
      return new Response(JSON.stringify({ success: false, error: 'No account found with this email address.' }), { status: 404 });
    }

    const user = results[0];

    if (user.password !== password) {
      return new Response(JSON.stringify({ success: false, error: 'Incorrect password. Please try again.' }), { status: 401 });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
