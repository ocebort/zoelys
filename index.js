import { onRequestPost as registerPost } from './functions/api/auth/register.js';
import { onRequestGet as verifyGet } from './functions/api/auth/verify.js';
import { onRequestPost as loginPost } from './functions/api/auth/login.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Routes API Backend
    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return registerPost({ request, env, ctx });
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return loginPost({ request, env, ctx });
    }

    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      return verifyGet({ request, env, ctx });
    }

    // Gestion du serveur d'actifs statiques
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return env.ASSETS.fetch(request);
    }

    return new Response('Ressource non trouvée', { status: 444 });
  }
};
