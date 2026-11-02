import { onRequestPost as registerPost } from './functions/api/auth/register.js';
import { onRequestGet as verifyGet } from './functions/api/auth/verify.js';
import { onRequestPost as loginPost } from './functions/api/auth/login.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return registerPost({ request, env, ctx });
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return loginPost({ request, env, ctx });
    }

    if (url.pathname === '/api/auth/verify' && request.method === 'GET') {
      return verifyGet({ request, env, ctx });
    }

    return env.ASSETS.fetch(request);
  }
};
