export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get('email');

  if (!email) {
    return new Response('Invalid verification link.', { status: 400 });
  }

  try {
    await env.zoelys_db.prepare(
      "UPDATE users SET verified = 1 WHERE email = ?"
    ).bind(email).run();

    // Redirect user to sign in page with success notice
    return Response.redirect(`${url.origin}/join?verified=true`, 302);
  } catch (err) {
    return new Response('Verification error: ' + err.message, { status: 500 });
  }
}
