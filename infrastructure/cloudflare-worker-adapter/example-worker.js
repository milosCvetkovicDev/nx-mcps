/**
 * Example Cloudflare Worker entry file
 * This shows how to use the worker adapter with your NX application
 */

import { createWorkerHandler } from './worker-adapter.js';
// Import your NX application
// import app from '../../dist/apps/petstore-api/main.js';

// Example app for demonstration
const app = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Simple router
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (url.pathname === '/api/pets') {
      // Example of using environment variables
      const apiVersion = env.API_VERSION || 'v1';
      
      return new Response(JSON.stringify({
        pets: [
          { id: 1, name: 'Fluffy', type: 'cat' },
          { id: 2, name: 'Buddy', type: 'dog' }
        ],
        version: apiVersion
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Example of using KV storage
    if (url.pathname.startsWith('/cache/')) {
      const key = url.pathname.substring(7);
      
      if (request.method === 'GET' && env.CACHE) {
        const value = await env.CACHE.get(key);
        return new Response(value || 'Not found', {
          status: value ? 200 : 404
        });
      }
      
      if (request.method === 'PUT' && env.CACHE) {
        const value = await request.text();
        await env.CACHE.put(key, value);
        return new Response('Stored', { status: 201 });
      }
    }
    
    return new Response('Not found', { status: 404 });
  }
};

// Create and export the worker handler
export default createWorkerHandler(app, {
  enableCors: true,
  corsOrigin: '*'
});

// Alternative: For Express-like apps
// export default createWorkerHandler(app, {
//   enableCors: true,
//   corsOrigin: process.env.CORS_ORIGIN || '*'
// }); 