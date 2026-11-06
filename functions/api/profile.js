export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const userId = url.searchParams.get('userId') || 'guest_user';

  // Vous pouvez récupérer les données depuis votre base D1 (context.env.zoelys_db) ou retourner un objet de test
  return new Response(JSON.stringify({
    user: {
      id: userId,
      full_name: "Test Admin",
      email: "admin@test.local",
      credit_balance: 5
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
