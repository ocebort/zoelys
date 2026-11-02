export async function onRequestGet(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Automatically redirect user to Onboarding Wizard upon email verification
  return Response.redirect(`${url.origin}/onboarding`, 302);
}
