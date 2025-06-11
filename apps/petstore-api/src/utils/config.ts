export interface Config {
  petstoreApiBase: string;
  openApiSpecUrl: string;
  cacheTTL: number;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
}

export const getConfig = (): Config => {
  const petstoreApiBase = process.env.PETSTORE_API_BASE || 'https://petstore3.swagger.io';
  
  return {
    petstoreApiBase,
    openApiSpecUrl: `${petstoreApiBase}/api/v3/openapi.json`,
    cacheTTL: parseInt(process.env.CACHE_TTL || '300000', 10), // 5 minutes default
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.RETRY_DELAY || '1000', 10),
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT || '30000', 10),
  };
}; 