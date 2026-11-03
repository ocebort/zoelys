export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Si on appelle l'API admin, on gère la requête avec la base D1
    if (url.pathname === '/api/admin/overview') {
      return handleAdminOverview(env);
    }

    // 2. Pour tout le reste (HTML, CSS, JS), Cloudflare sert les fichiers du dossier public/
    return env.ASSETS.fetch(request);
  }
};

async function handleAdminOverview(env) {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  const fallbackData = {
    success: true,
    stats: { totalUsers: 0, totalOwners: 0, totalSitters: 0, totalRequests: 0 },
    requests: [],
    sitters: []
  };

  try {
    if (!env || !env.zoelys_db) {
      return new Response(JSON.stringify(fallbackData), { status: 200, headers });
    }

    let users = [];
    try {
      const uRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role FROM users").all();
      if (uRes && uRes.results) users = uRes.results;
    } catch (e) {
      console.warn("Table users vide ou introuvable");
    }

    let requests = [];
    try {
      const rRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
      if (rRes && rRes.results) requests = rRes.results;
    } catch (e) {
      console.warn("Table client_requests vide ou introuvable");
    }

    const totalUsers = users.length;
    const totalOwners = users.filter(u => u.role && u.role.toLowerCase() === 'owner').length;
    const sittersList = users.filter(u => u.role && (u.role.toLowerCase().includes('sitter') || u.role.toLowerCase() === 'pet_sitter'));

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalSitters: sittersList.length,
        totalRequests: requests.length
      },
      requests,
      sitters: sittersList
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({
      ...fallbackData,
      error: err.message
    }), { status: 200, headers });
  }
}
