/**
 * Cloudflare Worker Adapter for NX Applications
 * This adapter wraps your NX application to make it compatible with Cloudflare Workers
 */

/**
 * Creates a Cloudflare Worker handler from an Express-like app or HTTP handler
 * @param {Function|Object} app - Express app instance or HTTP handler function
 * @param {Object} options - Adapter options
 * @returns {Object} Cloudflare Worker module
 */
export function createWorkerHandler(app, options = {}) {
  const {
    basePath = '',
    corsOrigin = '*',
    enableCors = true,
    maxBodySize = 1024 * 1024, // 1MB default
  } = options;

  // CORS headers
  const corsHeaders = enableCors ? {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  } : {};

  /**
   * Handle incoming requests
   */
  async function handleRequest(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS' && enableCors) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }

    try {
      // Parse request body if present
      let body = null;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        const contentType = request.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
          body = await request.json();
        } else if (contentType.includes('text/')) {
          body = await request.text();
        } else if (contentType.includes('multipart/form-data')) {
          body = await request.formData();
        } else {
          body = await request.arrayBuffer();
        }
      }

      // Create request context
      const reqContext = {
        method: request.method,
        url: url.pathname + url.search,
        headers: Object.fromEntries(request.headers),
        body,
        env,
        ctx,
        request // Original request object
      };

      // Handle the request based on app type
      let response;
      
      if (typeof app === 'function') {
        // Direct handler function
        response = await app(reqContext);
      } else if (app.handle && typeof app.handle === 'function') {
        // Express-like app with handle method
        response = await convertExpressToWorker(app, reqContext);
      } else if (app.fetch && typeof app.fetch === 'function') {
        // Already a Worker-compatible app
        response = await app.fetch(request, env, ctx);
      } else {
        throw new Error('Unsupported app type');
      }

      // Ensure response is a Response object
      if (!(response instanceof Response)) {
        response = createResponse(response);
      }

      // Add CORS headers if enabled
      if (enableCors) {
        Object.entries(corsHeaders).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      }

      return response;
    } catch (error) {
      console.error('Worker error:', error);
      
      return new Response(JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        }
      });
    }
  }

  // Return Cloudflare Worker module format
  return {
    fetch: handleRequest
  };
}

/**
 * Convert Express-like response to Cloudflare Worker Response
 */
function createResponse(data) {
  if (data === null || data === undefined) {
    return new Response(null, { status: 204 });
  }

  const { status = 200, headers = {}, body = data } = data;
  
  let responseBody;
  const responseHeaders = new Headers(headers);

  if (typeof body === 'object' && !Buffer.isBuffer(body)) {
    responseBody = JSON.stringify(body);
    if (!responseHeaders.has('content-type')) {
      responseHeaders.set('content-type', 'application/json');
    }
  } else {
    responseBody = body;
  }

  return new Response(responseBody, {
    status,
    headers: responseHeaders
  });
}

/**
 * Convert Express app to Worker response
 */
async function convertExpressToWorker(app, reqContext) {
  return new Promise((resolve, reject) => {
    // Mock Express request object
    const req = {
      method: reqContext.method,
      url: reqContext.url,
      headers: reqContext.headers,
      body: reqContext.body,
      query: Object.fromEntries(new URL(reqContext.request.url).searchParams),
      params: {},
      get: (header) => reqContext.headers[header.toLowerCase()]
    };

    // Mock Express response object
    let responseStatus = 200;
    const responseHeaders = {};
    let responseBody = '';

    const res = {
      status: (code) => {
        responseStatus = code;
        return res;
      },
      set: (header, value) => {
        responseHeaders[header] = value;
        return res;
      },
      json: (data) => {
        responseHeaders['content-type'] = 'application/json';
        responseBody = JSON.stringify(data);
        resolve(new Response(responseBody, {
          status: responseStatus,
          headers: responseHeaders
        }));
      },
      send: (data) => {
        responseBody = data;
        resolve(new Response(responseBody, {
          status: responseStatus,
          headers: responseHeaders
        }));
      },
      end: () => {
        resolve(new Response(responseBody, {
          status: responseStatus,
          headers: responseHeaders
        }));
      }
    };

    // Call Express app
    try {
      app.handle(req, res, (err) => {
        if (err) {
          reject(err);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Middleware to add Cloudflare-specific context to requests
 */
export function cloudflareContextMiddleware() {
  return (req, res, next) => {
    // Add Cloudflare-specific properties if available
    if (req.cf) {
      req.cloudflare = req.cf;
    }
    next();
  };
} 