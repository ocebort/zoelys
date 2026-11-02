export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Routage pour les appels API si nécessaire
    if (url.pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ ok: true, service: 'zoelys' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Sert les fichiers statiques du dossier public (HTML, CSS, images)
    try {
      let response = await env.ASSETS.fetch(request);
      if (response.status === 404) {
        const indexUrl = new URL('/index.html', request.url);
        response = await env.ASSETS.fetch(new Request(indexUrl, request));
      }
      return response;
    } catch (e) {
      return env.ASSETS.fetch(request);
    }
  }
};
