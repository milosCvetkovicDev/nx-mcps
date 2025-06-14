import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { getConfig, Logger, Cache, HttpClient } from './utils/index.js';
import { OpenApiLoader, ToolExecutor } from './tools/index.js';
import { ResourceHandler } from './resources/resource-handler.js';
import { PromptHandler } from './prompts/prompt-handler.js';

class PetstoreApiServer {
  private readonly server: Server;
  private readonly logger = new Logger('PetstoreApiServer');
  private readonly config = getConfig();
  private readonly cache = new Cache(this.config.cacheTTL);
  private readonly httpClient = new HttpClient(this.config);
  private readonly openApiLoader: OpenApiLoader;
  private readonly toolExecutor: ToolExecutor;
  private readonly resourceHandler: ResourceHandler;
  private readonly promptHandler = new PromptHandler();

  constructor() {
    // Initialize core services
    this.openApiLoader = new OpenApiLoader(this.config, this.httpClient, this.cache);
    this.toolExecutor = new ToolExecutor(this.config, this.httpClient, this.cache);
    this.resourceHandler = new ResourceHandler(this.openApiLoader);

    // Initialize MCP server
    this.server = new Server(
      {
        name: 'petstore-api',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
    this.logConfiguration();
  }

  private logConfiguration() {
    this.logger.info('Server configuration', {
      apiBase: this.config.petstoreApiBase,
      cacheTTL: this.config.cacheTTL,
      maxRetries: this.config.maxRetries,
      requestTimeout: this.config.requestTimeout,
    });
  }

  private setupHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      try {
        await this.openApiLoader.ensureLoaded();
        const apiTools = this.openApiLoader.getTools();

        const tools = Array.from(apiTools.values()).map((tool) => ({
          name: tool.name,
          description: tool.description,
          inputSchema: {
            type: 'object',
            properties: tool.parameters.reduce((acc, param) => {
              acc[param.name] = {
                type: param.type,
                description: param.description,
              };
              return acc;
            }, {} as any),
            required: tool.parameters
              .filter((p) => p.required)
              .map((p) => p.name),
          },
        }));

        return { tools };
      } catch (error) {
        this.logger.error('Failed to list tools', error as Error);
        return { tools: [] };
      }
    });

    // Execute tools
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        await this.openApiLoader.ensureLoaded();
        const tool = this.openApiLoader.getTool(name);

        if (!tool) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Tool "${name}" not found`,
              },
            ],
            isError: true,
          };
        }

        // Execute the tool
        const response = await this.toolExecutor.execute(tool, args);

        // Format the response
        const responseText = JSON.stringify(response, null, 2);

        return {
          content: [
            {
              type: 'text',
              text: responseText,
            },
          ],
        };
      } catch (error) {
        this.logger.error(`Failed to execute tool ${name}`, error as Error);
        return {
          content: [
            {
              type: 'text',
              text: `Error executing ${name}: ${(error as Error).message}`,
            },
          ],
          isError: true,
        };
      }
    });

    // List resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      try {
        const resources = await this.resourceHandler.listResources();
        return { resources };
      } catch (error) {
        this.logger.error('Failed to list resources', error as Error);
        return { resources: [] };
      }
    });

    // Read resources
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        const resource = await this.resourceHandler.readResource(uri);
        return {
          contents: [resource],
        };
      } catch (error) {
        this.logger.error(`Failed to read resource ${uri}`, error as Error);
        throw error;
      }
    });

    // List prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      try {
        const prompts = this.promptHandler.listPrompts();
        return { prompts };
      } catch (error) {
        this.logger.error('Failed to list prompts', error as Error);
        return { prompts: [] };
      }
    });

    // Get prompts
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const prompt = this.promptHandler.getPrompt(name, args);
        return prompt;
      } catch (error) {
        this.logger.error(`Failed to get prompt ${name}`, error as Error);
        throw error;
      }
    });

    // Handle server errors
    this.server.onerror = (error) => {
      this.logger.error('Server error', error);
    };
  }

  async start() {
    try {
      const transport = new StdioServerTransport();
      await this.server.connect(transport);

      this.logger.info('Petstore API MCP server started successfully!');
      
      // Pre-load the OpenAPI spec in the background
      this.openApiLoader.loadSpec().catch((error) => {
        this.logger.error('Failed to pre-load OpenAPI spec', error);
      });
    } catch (error) {
      this.logger.error('Failed to start server', error as Error);
      throw error;
    }
  }
}

// Start the server
const server = new PetstoreApiServer();
server.start().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
