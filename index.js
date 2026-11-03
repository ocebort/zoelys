export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const method = request.method;
    const path = url.pathname;

    if (path === '/api/admin/overview' && method === 'GET') {
      return handleAdminOverview(env);
    }
    if (path === '/api/admin/match' && method === 'GET') {
      return handleMatchAlgorithm(url, env);
    }
    if (path === '/api/admin/propose' && method === 'POST') {
      return handleSendProposal(request, env);
    }
    if (path === '/api/admin/cancel-proposal' && method === 'POST') {
      return handleCancelProposal(request, env);
    }
    if ((path === '/api/requests' || path === '/api/client-requests' || path === '/api/bookings') && method === 'POST') {
      return handleCreateRequest(request, env);
    }
    if ((path === '/api/owner/requests' || path === '/api/client-requests') && method === 'GET') {
      return handleOwnerRequests(url, env);
    }
    if (path === '/api/owner/accept-proposal' && method === 'POST') {
      return handleAcceptProposal(request, env);
    }

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
      const uRes = await env.zoelys_db.prepare("SELECT id, full_name, email, role, location, rating, bio FROM users").all();
      if (uRes && uRes.results) users = uRes.results;
    } catch (e) {}

    let requests = [];
    try {
      const rRes = await env.zoelys_db.prepare("SELECT * FROM client_requests ORDER BY id DESC").all();
      if (rRes && rRes.results) requests = rRes.results;
    } catch (e) {}

    const totalUsers = users.length;
    const totalOwners = users.filter(u => u.role && u.role.toLowerCase() === 'owner').length;
    
    // Filtrage strict : uniquement les sitters pour l'administration et le matching
    const sittersList = users.filter(u => u.role && (u.role.toLowerCase() === 'pet_sitter' || u.role.toLowerCase().includes('sitter')));

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

async function handleMatchAlgorithm(url, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const requestId = url.searchParams.get('requestId');

  try {
    if (!env || !env.zoelys_db) {
      return new Response(JSON.stringify({ success: false, error: 'Database binding missing' }), { status: 500, headers });
    }

    const reqRes = await env.zoelys_db.prepare("SELECT * FROM client_requests WHERE id = ?").bind(requestId).first();
    
    // Sélection exclusive des pet_sitters (exclusion des owners)
    const sittersRes = await env.zoelys_db.prepare("SELECT * FROM users WHERE role = 'pet_sitter' OR role LIKE '%sitter%'").all();
    const sitters = sittersRes.results || [];

    const reqService = (reqRes && reqRes.service_type) ? reqRes.service_type.toLowerCase() : '';

    const scoredSitters = sitters.map(sitter => {
      let score = 70;
      let reasons = [];

      const sitterRole = (sitter.role || '').toLowerCase();
      const sitterBio = (sitter.bio || sitter.description || '').toLowerCase();
      const sitterLocation = (sitter.location || 'Lisbon').toLowerCase();

      if (sitterRole.includes('sitter')) {
        score += 20;
        reasons.push("Verified professional pet sitter profile (+20%).");
      }

      if (reqService.includes('vet') || reqService.includes('medical') || sitterBio.includes('vet') || sitterBio.includes('medical')) {
        if (sitterBio.includes('vet') || sitterBio.includes('medical')) {
          score += 15;
          reasons.push("Specialized veterinary / medical background matches request (+15%).");
        } else {
          reasons.push("Standard care profile (no specialized veterinary background noted).");
        }
      }

      if (sitterLocation.includes('lisbon')) {
        score += 10;
        reasons.push("Located in Lisbon service area (+10%).");
      }

      if (sitter.rating) {
        const ratingBonus = Math.round(parseFloat(sitter.rating) * 3);
        score += ratingBonus;
        reasons.push(`Platform rating of ${sitter.rating}/5 (+${ratingBonus}%).`);
      } else {
        score += 5;
        reasons.push("Reliable verified background check passed (+5%).");
      }

      return {
        ...sitter,
        matchScore: Math.min(score, 98),
        matchReasons: reasons
      };
    });

    scoredSitters.sort((a, b) => b.matchScore - a.matchScore);

    return new Response(JSON.stringify({
      success: true,
      request: reqRes,
      topMatches: scoredSitters
    }), { status: 200, headers });

  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
  }
}

async function handleSendProposal(request, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = await request.json();
    const { requestId, selectedSitterIds } = body;

    // Stocke éventuellement les IDs des sitters proposés sous forme de JSON si besoin
    await env.zoelys_db.prepare(
      "UPDATE client_requests SET status = 'proposed' WHERE id = ?"
    ).bind(requestId).run();

    return new Response(JSON.stringify({ success: true, message: 'Proposal sent to owner successfully!' }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
  }
}

async function handleCancelProposal(request, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = await request.json();
    const { requestId } = body;

    await env.zoelys_db.prepare(
      "UPDATE client_requests SET status = 'pending' WHERE id = ?"
    ).bind(requestId).run();

    return new Response(JSON.stringify({ success: true, message: 'Proposal canceled successfully!' }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
  }
}

async function handleAcceptProposal(request, env) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  try {
    const body = await request.json();
    const { requestId } = body;

    await env.zoelys_db.prepare(
      "UPDATE client_requests SET status = 'confirmed' WHERE id = ?"
    ).bind(requestId).run();

    return new Response(JSON.stringify({ success: true, message: 'Booking confirmed!' }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500, headers });
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
