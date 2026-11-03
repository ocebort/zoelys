export async function onRequestGet(context) {
  const { env } = context;
  
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  // Objet de secours par défaut pour ne jamais casser le front-end
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

    // Récupération des utilisateurs
    let users = [];
    try {
      const uRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role FROM users").all();
      if (uRes && uRes.results) users = uRes.results;
    } catch (e) {
      console.warn("Table users introuvable ou vide :", e.message);
    }

    // Récupération des demandes de soins
    let requests = [];
    try {
      const rRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
      if (rRes && rRes.results) requests = rRes.results;
    } catch (e) {
      console.warn("Table client_requests introuvable ou vide :", e.message);
    }

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
      requests,
      sitters: sittersList
    }), { status: 200, headers });

  } catch (err) {
    // Même en cas d'erreur critique, on renvoie un JSON valide
    return new Response(JSON.stringify({
      ...fallbackData,
      error: err.message
    }), { status: 200, headers });
  }
}
