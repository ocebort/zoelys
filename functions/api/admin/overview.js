export async function onRequestGet(context) {
  const { env } = context;

  try {
    // 1. Fetch user counts & breakdowns
    const userStats = await env.zoelys_db.prepare(
      `SELECT 
         COUNT(*) as total_users,
         SUM(CASE WHEN role = 'owner' THEN 1 ELSE 0 END) as total_owners,
         SUM(CASE WHEN role = 'pet_sitter' THEN 1 ELSE 0 END) as total_sitters
       FROM users`
    ).first();

    // 2. Fetch all care requests / bookings
    const { results: requests } = await env.zoelys_db.prepare(
      `SELECT * FROM care_requests ORDER BY created_at DESC`
    ).all();

    // 3. Fetch all available sitters for matching
    const { results: sitters } = await env.zoelys_db.prepare(
      `SELECT id, full_name, email, role FROM users WHERE role = 'pet_sitter'`
    ).all();

    return new Response(JSON.stringify({
      success: true,
      stats: {
        totalUsers: userStats.total_users || 0,
        totalOwners: userStats.total_owners || 0,
        totalSitters: userStats.total_sitters || 0,
        totalRequests: requests ? requests.length : 0
      },
      requests: requests || [],
      sitters: sitters || []
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Admin dashboard data error:', err.message);
    return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}
