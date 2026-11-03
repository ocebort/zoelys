export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    // 1. Admin Overview API
    if (path === '/api/admin/overview' && method === 'GET') {
      return handleAdminOverview(env);
    }

    // 2. Création de demande (supporte toutes les variantes possibles du front-end)
    if ((path === '/api/requests' || path === '/api/client-requests' || path === '/api/bookings') && method === 'POST') {
      return handleCreateRequest(request, env);
    }

    // 3. Récupération des demandes du propriétaire
    if ((path === '/api/owner/requests' || path === '/api/client-requests') && method === 'GET') {
      return handleOwnerRequests(url, env);
    }

    // 4. Fichiers statiques du dossier public/
    return env.ASSETS.fetch(request);
  }
};

async function handleAdminOverview(env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const fallbackData = { success: true, stats: { totalUsers: 0, totalOwners: 0, totalSitters: 0, totalRequests: 0 }, requests: [], sitters: [] };

  try {
    if (!env || !env.zoelys_db) return new Response(JSON.stringify(fallbackData), { status: 200, headers });

    let users = [];
    try {
      const uRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role FROM users").all();
      if (uRes && uRes.results) users = uRes.results;
    } catch (e) {}

    let requests = [];
    try {
      const rRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
      if (rRes && rRes.results) requests = rRes.results;
    } catch (e) {}

    const totalUsers = users.length;
    const totalOwners = users.filter(u => u.role && u.role.toLowerCase() === 'owner').length;
    const sittersList = users.filter(u => u.role && (u.role.toLowerCase().includes('sitter') || u.role.toLowerCase() === 'pet_sitter'));

    return new Response(JSON.stringify({
      success: true,
      stats: { totalUsers, totalOwners, totalSitters: sittersList.length, totalRequests: requests.length },
      requests,
      sitters: sittersList
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ ...fallbackData, error: err.message }), { status: 200, headers });
  }
}

async function handleCreateRequest(request, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = await request.json();
    const { email, full_name, pet_name, pet_type, service_type } = body;

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    
    await env.zoelys_db.prepare(
      `INSERT INTO client_requests (id, email, full_name, pet_name, pet_type, service_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      requestId,
      email || 'owner@test.local',
      full_name || 'Propriétaire',
      pet_name || 'Zoé',
      pet_type || 'Chien',
      service_type || 'Garde',
      'pending'
    ).run();

    return new Response(JSON.stringify({ success: true, requestId }), { status: 201, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }, null, 2), { status: 500, headers });
  }
}

async function handleOwnerRequests(url, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const email = url.searchParams.get('email');

  try {
    if (!email || !env || !env.zoelys_db) {
      return new Response(JSON.stringify({ success: true, requests: [] }), { status: 200, headers });
    }

    const res = await env.zoelys_db.prepare(
      `SELECT * FROM client_requests WHERE email = ? ORDER BY id DESC`
    ).bind(email).all();

    return new Response(JSON.stringify({ success: true, requests: res.results || [] }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, requests: [], error: err.message }), { status: 500, headers });
  }
}
