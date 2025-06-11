import { Logger, HttpClient, Cache, Config } from '../utils/index.js';
import { ApiTool, ApiResponse } from '../types/index.js';

export class ToolExecutor {
  private readonly logger = new Logger('ToolExecutor');
  private readonly httpClient: HttpClient;
  private readonly cache: Cache<ApiResponse>;
  private readonly config: Config;

  constructor(config: Config, httpClient: HttpClient, cache: Cache) {
    this.config = config;
    this.httpClient = httpClient;
    this.cache = cache;
  }

  async execute(tool: ApiTool, args: Record<string, any> = {}): Promise<ApiResponse> {
    this.logger.debug(`Executing tool: ${tool.name}`, { args });

    // Build cache key for GET requests
    const cacheKey = this.buildCacheKey(tool, args);
    
    // Check cache for GET requests
    if (tool.method === 'get' && cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Returning cached response for ${tool.name}`);
        return cached;
      }
    }

    try {
      // Build request
      const { url, params, headers, data } = this.buildRequest(tool, args);

      // Execute request
      const response = await this.httpClient.request({
        method: tool.method,
        url,
        params,
        headers,
        data,
        validateStatus: () => true, // Don't throw on non-2xx status
      });

      // Format response
      const apiResponse: ApiResponse = {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      };

      // Cache successful GET requests
      if (tool.method === 'get' && response.status >= 200 && response.status < 300 && cacheKey) {
        this.cache.set(cacheKey, apiResponse);
      }

      return apiResponse;
    } catch (error) {
      this.logger.error(`Failed to execute tool ${tool.name}`, error as Error);
      throw new Error(`Failed to execute ${tool.name}: ${(error as Error).message}`);
    }
  }

  private buildRequest(tool: ApiTool, args: Record<string, any>): {
    url: string;
    params: Record<string, any>;
    headers: Record<string, any>;
    data: any;
  } {
    let url = `${this.config.petstoreApiBase}/api/v3${tool.path}`;
    const queryParams: Record<string, any> = {};
    const headers: Record<string, any> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    let body: any = undefined;

    // Validate required parameters
    const missingParams = tool.parameters
      .filter(p => p.required && args[p.name] === undefined)
      .map(p => p.name);

    if (missingParams.length > 0) {
      throw new Error(`Missing required parameters: ${missingParams.join(', ')}`);
    }

    // Process parameters
    tool.parameters.forEach((param) => {
      const value = args[param.name];
      if (value === undefined) return;

      switch (param.location) {
        case 'path':
          url = url.replace(`{${param.name}}`, encodeURIComponent(String(value)));
          break;
        case 'query':
          queryParams[param.name] = value;
          break;
        case 'header':
          headers[param.name] = value;
          break;
        case 'body':
          body = value;
          break;
      }
    });

    // Validate all path parameters were replaced
    const unreplacedParams = url.match(/{[^}]+}/g);
    if (unreplacedParams) {
      throw new Error(`Unreplaced path parameters: ${unreplacedParams.join(', ')}`);
    }

    return { url, params: queryParams, headers, data: body };
  }

  private buildCacheKey(tool: ApiTool, args: Record<string, any>): string | null {
    // Only cache GET requests
    if (tool.method !== 'get') return null;

    // Build a cache key from the tool name and relevant parameters
    const relevantArgs = tool.parameters
      .filter(p => p.location !== 'header' || p.name.toLowerCase() === 'authorization')
      .reduce((acc, param) => {
        if (args[param.name] !== undefined) {
          acc[param.name] = args[param.name];
        }
        return acc;
      }, {} as Record<string, any>);

    return `${tool.name}:${JSON.stringify(relevantArgs)}`;
  }
} 