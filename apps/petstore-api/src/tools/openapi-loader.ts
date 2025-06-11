import SwaggerParser from '@apidevtools/swagger-parser';
import { OpenAPIV3 } from 'openapi-types';
import { Logger, HttpClient, Cache, Config } from '../utils/index.js';
import { ApiTool, ToolParameter, OpenAPIDocument } from '../types/index.js';

export class OpenApiLoader {
  private readonly logger = new Logger('OpenApiLoader');
  private readonly cache: Cache<OpenAPIDocument>;
  private readonly httpClient: HttpClient;
  private readonly config: Config;
  private openApiSpec: OpenAPIDocument | null = null;
  private apiTools = new Map<string, ApiTool>();

  constructor(config: Config, httpClient: HttpClient, cache: Cache) {
    this.config = config;
    this.httpClient = httpClient;
    this.cache = cache;
  }

  async loadSpec(): Promise<void> {
    const cacheKey = 'openapi-spec';
    
    // Try to get from cache first
    const cachedSpec = this.cache.get(cacheKey);
    if (cachedSpec) {
      this.openApiSpec = cachedSpec;
      this.logger.info('Loaded OpenAPI spec from cache');
      this.generateToolsFromSpec();
      return;
    }

    try {
      this.logger.info('Loading OpenAPI specification', { url: this.config.openApiSpecUrl });
      const response = await this.httpClient.get(this.config.openApiSpecUrl);
      
      this.openApiSpec = await SwaggerParser.validate(response.data) as OpenAPIDocument;
      
      // Cache the spec
      this.cache.set(cacheKey, this.openApiSpec, 3600000); // Cache for 1 hour
      
      this.logger.info('OpenAPI specification loaded successfully');
      this.generateToolsFromSpec();
    } catch (error) {
      this.logger.error('Failed to load OpenAPI specification', error as Error);
      throw new Error(`Failed to load OpenAPI specification: ${(error as Error).message}`);
    }
  }

  private generateToolsFromSpec(): void {
    if (!this.openApiSpec?.paths) {
      this.logger.warn('No paths found in OpenAPI specification');
      return;
    }

    this.apiTools.clear();

    Object.entries(this.openApiSpec.paths).forEach(([path, pathItem]) => {
      if (!pathItem) return;

      const methods = ['get', 'post', 'put', 'delete', 'patch'] as const;
      
      methods.forEach((method) => {
        const operation = (pathItem as any)[method] as OpenAPIV3.OperationObject;
        if (!operation) return;

        const tool = this.createToolFromOperation(path, method, operation);
        if (tool) {
          this.apiTools.set(tool.name, tool);
        }
      });
    });

    this.logger.info(`Generated ${this.apiTools.size} tools from OpenAPI spec`);
  }

  private createToolFromOperation(
    path: string,
    method: string,
    operation: OpenAPIV3.OperationObject
  ): ApiTool | null {
    try {
      const operationId = operation.operationId || `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const description = operation.summary || operation.description || `${method.toUpperCase()} ${path}`;

      const parameters: ToolParameter[] = [];

      // Process parameters
      if (operation.parameters) {
        operation.parameters.forEach((param: any) => {
          if ('$ref' in param) {
            // Resolve reference if needed
            const resolved = this.resolveReference(param.$ref);
            if (resolved && 'name' in resolved) {
              param = resolved;
            } else {
              return;
            }
          }
          
          parameters.push({
            name: param.name,
            description: param.description,
            required: param.required || false,
            type: param.schema?.type || 'string',
            location: param.in as 'path' | 'query' | 'header',
            schema: param.schema,
          });
        });
      }

      // Process request body
      if (operation.requestBody && 'content' in operation.requestBody) {
        const content = operation.requestBody.content;
        const jsonContent = content['application/json'];
        if (jsonContent?.schema) {
          parameters.push({
            name: 'body',
            description: operation.requestBody.description || 'Request body',
            required: operation.requestBody.required || false,
            type: 'object',
            location: 'body',
            schema: jsonContent.schema,
          });
        }
      }

      return {
        name: operationId,
        description,
        method,
        path,
        parameters,
        security: operation.security,
        requestBody: operation.requestBody,
        responses: operation.responses,
      };
    } catch (error) {
      this.logger.error(`Failed to create tool for ${method} ${path}`, error as Error);
      return null;
    }
  }

  private resolveReference(ref: string): any {
    if (!ref.startsWith('#/')) return null;
    
    const parts = ref.slice(2).split('/');
    let current: any = this.openApiSpec;
    
    for (const part of parts) {
      current = current?.[part];
      if (!current) return null;
    }
    
    return current;
  }

  getSpec(): OpenAPIDocument | null {
    return this.openApiSpec;
  }

  getTools(): Map<string, ApiTool> {
    return new Map(this.apiTools);
  }

  getTool(name: string): ApiTool | undefined {
    return this.apiTools.get(name);
  }

  async ensureLoaded(): Promise<void> {
    if (!this.openApiSpec) {
      await this.loadSpec();
    }
  }
} 