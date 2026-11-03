export async function onRequestGet(context) {
  const { env } = context;

  try {
    if (!env || !env.zoelys_db) {
      return new Response(JSON.stringify({
        success: true,
        stats: { totalUsers: 0, totalOwners: 0, totalSitters: 0, totalRequests: 0 },
        requests: [],
        sitters: []
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // 1. User Stats
    let userStats = { total_users: 0, total_owners: 0, total_sitters: 0 };
    try {
      const statsRes = await env.zoelys_db.prepare(
        `SELECT 
           COUNT(*) as total_users,
           SUM(CASE WHEN LOWER(role) = 'owner' THEN 1 ELSE 0 END) as total_owners,
           SUM(CASE WHEN LOWER(role) LIKE '%sitter%' OR LOWER(role) = 'pet_sitter' THEN 1 ELSE 0 END) as total_sitters
         FROM users`
      ).first();
      if (statsRes) userStats = statsRes;
    } catch (e) {
      console.warn('User stats error:', e.message);
    }

    // 2. Client Requests (using your actual table name: client_requests)
    let requests = [];
    try {
      const reqRes = await env.zoelys_db.prepare(
        `SELECT * FROM client_requests ORDER BY id DESC`
      ).all();
      if (reqRes && reqRes.results) requests = reqRes.results;
    } catch (e) {
      console.warn('Client requests error:', e.message);
    }

    // 3. Sitters Roster
    let sitters = [];
    try {
      const sittersRes = await env.zoelys_db.prepare(
        `SELECT id, full_name, email, role FROM users WHERE LOWER(role) LIKE '%sitter%' OR LOWER(role) = 'pet_sitter'`
      ).all();
      if (sittersRes && sittersRes.results) sitters = sittersRes.results;
    } catch (e) {
      console.warn('Sitters error:', e.message);
    }

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers: userStats.total_users || 0,
        totalOwners: userStats.total_owners || 0,
        totalSitters: userStats.total_sitters || 0,
        totalRequests: requests.length
      },
      requests: requests,
      sitters: sitters
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      success: true,
      stats: { totalUsers: 0, totalOwners: 0, totalSitters: 0, totalRequests: 0 },
      requests: [],
      sitters: [],
      error: err.message
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
