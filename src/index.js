export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -------------------------------------------------------------
    // 1. API Route: Submit New Client Request
    // -------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/api/requests') {
      try {
        const body = await request.json();
        const id = crypto.randomUUID();
        
        await env.zoelys_db.prepare(`
          INSERT INTO client_requests (
            id, full_name, email, neighbourhood, pet_type, pet_name, 
            behavioral_traits, medical_conditions, outdoor_space, experience_level
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          body.full_name || 'Anonymous',
          body.email || '',
          body.neighbourhood || null,
          body.pet_type || null,
          body.pet_name || null,
          body.behavioral_traits ? JSON.stringify(body.behavioral_traits) : null,
          body.medical_conditions || null,
          body.outdoor_space || null,
          body.experience_level || null
        ).run();

        return new Response(JSON.stringify({ success: true, id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // 2. API Route: Submit New Sitter Application (NEW!)
    // -------------------------------------------------------------
    if (request.method === 'POST' && url.pathname === '/api/sitters') {
      try {
        const body = await request.json();
        const id = 'sitter-' + crypto.randomUUID().slice(0, 8);
        
        await env.zoelys_db.prepare(`
          INSERT INTO sitters (
            id, full_name, neighbourhood, experience_years, vet_tech_background,
            accepted_pet_types, can_handle_anxiety, can_handle_medication,
            has_outdoor_space, nightly_rate_usd, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `).bind(
          id,
          body.full_name,
          body.neighbourhood,
          parseInt(body.experience_years) || 1,
          body.vet_tech_background ? 1 : 0,
          body.accepted_pet_types || 'Dog,Cat',
          body.can_handle_anxiety ? 1 : 0,
          body.can_handle_medication ? 1 : 0,
          body.has_outdoor_space ? 1 : 0,
          parseFloat(body.nightly_rate_usd) || 75.00
        ).run();

        return new Response(JSON.stringify({ success: true, id }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // 3. API Route: Get All Client Requests (Admin)
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/requests') {
      try {
        const { results } = await env.zoelys_db.prepare(
          `SELECT * FROM client_requests ORDER BY created_at DESC`
        ).all();
        return new Response(JSON.stringify(results), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // 4. API Route: Run Matchmaker Algorithm
    // -------------------------------------------------------------
    if (request.method === 'GET' && url.pathname === '/api/match') {
      try {
        const requestId = url.searchParams.get('requestId');
        if (!requestId) return new Response("Missing requestId", { status: 400 });

        const clientReq = await env.zoelys_db.prepare(`SELECT * FROM client_requests WHERE id = ?`).bind(requestId).first();
        if (!clientReq) return new Response("Request not found", { status: 404 });

        const { results: sitters } = await env.zoelys_db.prepare(`SELECT * FROM sitters WHERE is_active = 1`).all();

        let matches = sitters.map(sitter => {
          let score = 0;
          let reasons = [];

          if (clientReq.pet_type && sitter.accepted_pet_types.includes(clientReq.pet_type)) {
            score += 25;
            reasons.push(`Accepts ${clientReq.pet_type}`);
          }

          if (clientReq.neighbourhood && sitter.neighbourhood.toLowerCase() === clientReq.neighbourhood.toLowerCase()) {
            score += 20;
            reasons.push(`Located in ${sitter.neighbourhood}`);
          } else {
            score += 10;
          }

          if (clientReq.medical_conditions === 'Yes' && sitter.can_handle_medication) {
            score += 15;
            reasons.push('Can administer medication');
          } else {
            score += 10;
          }

          if (sitter.has_outdoor_space) {
            score += 15;
            reasons.push('Has outdoor space');
          }

          if (sitter.vet_tech_background) {
            score += 15;
            reasons.push('Certified Vet Tech');
          } else {
            score += 10;
          }

          score = Math.min(100, score);

          return {
            sitter_id: sitter.id,
            sitter_name: sitter.full_name,
            neighbourhood: sitter.neighbourhood,
            nightly_rate: sitter.nightly_rate_usd,
            match_score: score,
            match_reasons: reasons
          };
        });

        matches.sort((a, b) => b.match_score - a.match_score);
        return new Response(JSON.stringify(matches), { headers: { 'Content-Type': 'application/json' } });
      } catch (e) {
        return new Response(JSON.stringify({ error: e.message }), { status: 500 });
      }
    }

    // -------------------------------------------------------------
    // 5. Default: Pass to Cloudflare Static Assets
    // -------------------------------------------------------------
    return env.ASSETS.fetch(request);
  }
};
