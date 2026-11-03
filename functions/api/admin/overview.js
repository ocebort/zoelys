export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.zoelys_db) {
      return new Response(JSON.stringify({ success: false, error: 'Database connection missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Récupération de tous les utilisateurs
    const usersRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role FROM users").all();
    const users = usersRes.results || [];

    // Récupération de toutes les demandes de clients
    const reqRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
    const requests = reqRes.results || [];

    // Calcul des statistiques
    const totalUsers = users.length;
    const totalOwners = users.filter(u => u.role && u.role.toLowerCase() === 'owner').length;
    const totalSitters = users.filter(u => u.role && (u.role.toLowerCase().includes('sitter') || u.role.toLowerCase() === 'pet_sitter')).length;
    const sittersList = users.filter(u => u.role && (u.role.toLowerCase().includes('sitter') || u.role.toLowerCase() === 'pet_sitter'));

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalSitters,
        totalRequests: requests.length
      },
      requests: requests,
      sitters: sittersList
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
