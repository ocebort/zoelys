export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;

    // 1. Admin Overview API
    if (url.pathname === '/api/admin/overview' && method === 'GET') {
      return handleAdminOverview(env);
    }

    // 2. Création d'une demande par un propriétaire (POST)
    if (url.pathname === '/api/requests' && method === 'POST') {
      return handleCreateRequest(request, env);
    }

    // 3. Récupération des demandes d'un propriétaire spécifique (GET /api/owner/requests?email=...)
    if (url.pathname === '/api/owner/requests' && method === 'GET') {
      return handleOwnerRequests(url, env);
    }

    // 4. Pour tout le reste (HTML, CSS, JS statiques), Cloudflare sert le dossier public/
    return env.ASSETS.fetch(request);
  }
};

// --- GESTION ADMIN ---
async function handleAdminOverview(env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const fallbackData = { success: true, stats: { totalUsers: 0, totalOwners: 0, totalSitters: 0, totalRequests: 0 }, requests: [], sitters: [] };

  try {
    if (!env || !env.zoelys_db) return new Response(JSON.stringify(fallbackData), { status: 200, headers });

    let users = [];
    try {
      const uRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role FROM users").all();
      if (uRes && uRes.results) users = uRes.results;
    } catch (e) { console.warn("Table users vide"); }

    let requests = [];
    try {
      const rRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
      if (rRes && rRes.results) requests = rRes.results;
    } catch (e) { console.warn("Table client_requests vide"); }

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

// --- CRÉATION D'UNE DEMANDE DE SITTING ---
async function handleCreateRequest(request, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = await request.json();
    const { email, full_name, pet_name, pet_type, service_type } = body;

    if (!email || !pet_name) {
      return new Response(JSON.stringify({ success: false, error: "Email et nom de l'animal requis" }), { status: 400, headers });
    }

    const requestId = 'req_' + Math.random().toString(36).substring(2, 9);
    
    // Insertion dans la base D1 zoelys_db
    await env.zoelys_db.prepare(
      `INSERT INTO client_requests (id, email, full_name, pet_name, pet_type, service_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(
      requestId,
      email,
      full_name || 'Propriétaire',
      pet_name,
      pet_type || 'Chien',
      service_type || 'Garde',
      'pending'
    ).run();

    return new Response(JSON.stringify({ success: true, requestId }), { status: 201, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
  }
}

// --- RÉCUPÉRATION DES DEMANDES DU PROPRIÉTAIRE ---
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
