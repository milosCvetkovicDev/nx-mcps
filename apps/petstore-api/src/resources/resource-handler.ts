import { OpenApiLoader } from '../tools/index.js';

export interface Resource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export class ResourceHandler {
  private readonly openApiLoader: OpenApiLoader;

  constructor(openApiLoader: OpenApiLoader) {
    this.openApiLoader = openApiLoader;
  }

  async listResources(): Promise<Resource[]> {
    await this.openApiLoader.ensureLoaded();

    return [
      {
        uri: 'openapi://specification',
        name: 'OpenAPI Specification',
        description: 'The complete OpenAPI specification for the Petstore API',
        mimeType: 'application/json',
      },
      {
        uri: 'openapi://endpoints',
        name: 'API Endpoints',
        description: 'List of all available API endpoints',
        mimeType: 'text/plain',
      },
      {
        uri: 'openapi://schemas',
        name: 'Data Schemas',
        description: 'JSON schemas for all data models',
        mimeType: 'application/json',
      },
      {
        uri: 'openapi://tools',
        name: 'Available Tools',
        description: 'List of all generated MCP tools with their descriptions',
        mimeType: 'application/json',
      },
    ];
  }

  async readResource(uri: string): Promise<{ uri: string; mimeType: string; text: string }> {
    await this.openApiLoader.ensureLoaded();

    switch (uri) {
      case 'openapi://specification': {
        const spec = this.openApiLoader.getSpec();
        if (!spec) {
          throw new Error('OpenAPI specification not loaded');
        }
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(spec, null, 2),
        };
      }

      case 'openapi://endpoints': {
        const tools = this.openApiLoader.getTools();
        const endpoints = Array.from(tools.values())
          .map((tool) => `${tool.method.toUpperCase()} ${tool.path} - ${tool.description}`)
          .sort()
          .join('\n');
        
        return {
          uri,
          mimeType: 'text/plain',
          text: endpoints,
        };
      }

      case 'openapi://schemas': {
        const spec = this.openApiLoader.getSpec();
        const schemas = spec?.components?.schemas || {};
        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(schemas, null, 2),
        };
      }

      case 'openapi://tools': {
        const tools = this.openApiLoader.getTools();
        const toolList = Array.from(tools.values()).map(tool => ({
          name: tool.name,
          description: tool.description,
          method: tool.method,
          path: tool.path,
          parameters: tool.parameters.map(p => ({
            name: p.name,
            type: p.type,
            location: p.location,
            required: p.required,
            description: p.description,
          })),
        }));

        return {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify(toolList, null, 2),
        };
      }

      default:
        throw new Error(`Resource not found: ${uri}`);
    }
  }
} 