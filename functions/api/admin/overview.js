export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. Safe User Stats Query
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
      console.warn('User stats query fallback:', e.message);
    }

    // 2. Safe Care Requests Query
    let requests = [];
    try {
      const reqRes = await env.zoelys_db.prepare(
        `SELECT * FROM care_requests ORDER BY id DESC`
      ).all();
      if (reqRes && reqRes.results) requests = reqRes.results;
    } catch (e) {
      console.warn('Care requests query fallback (table may not exist yet):', e.message);
    }

    // 3. Safe Sitters Roster Query
    let sitters = [];
    try {
      const sittersRes = await env.zoelys_db.prepare(
        `SELECT id, full_name, email, role FROM users WHERE LOWER(role) LIKE '%sitter%' OR LOWER(role) = 'pet_sitter'`
      ).all();
      if (sittersRes && sittersRes.results) sitters = sittersRes.results;
    } catch (e) {
      console.warn('Sitters query fallback:', e.message);
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
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (err) {
    console.error('Admin API Critical Error:', err.message);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
