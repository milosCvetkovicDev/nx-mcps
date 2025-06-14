import { describe, it, expect, beforeEach } from '@jest/globals';
import { Cache, Logger, HttpClient, getConfig } from './utils/index.js';
import { OpenApiLoader, ToolExecutor } from './tools/index.js';
import { ResourceHandler } from './resources/resource-handler.js';
import { PromptHandler } from './prompts/prompt-handler.js';

describe('PetstoreApiServer Components', () => {
  let config: ReturnType<typeof getConfig>;
  let cache: Cache;
  let httpClient: HttpClient;

  beforeEach(() => {
    config = getConfig();
    cache = new Cache(config.cacheTTL);
    httpClient = new HttpClient(config);
  });
  

  describe('Cache', () => {
    it('should store and retrieve values', () => {
      const testData = { message: 'Hello, World!' };
      cache.set('test-key', testData);
      
      const retrieved = cache.get('test-key');
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = cache.get('non-existent');
      expect(result).toBeNull();
    });

    it('should respect TTL', async () => {
      const shortCache = new Cache(100); // 100ms TTL
      shortCache.set('test-key', 'test-value');
      
      // Value should exist immediately
      expect(shortCache.get('test-key')).toBe('test-value');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Value should be gone
      expect(shortCache.get('test-key')).toBeNull();
    });
  });

  describe('Logger', () => {
    it('should create logger instances', () => {
      const logger = new Logger('TestComponent');
      expect(logger).toBeDefined();
      
      // Logger methods should not throw
      expect(() => logger.debug('Debug message')).not.toThrow();
      expect(() => logger.info('Info message')).not.toThrow();
      expect(() => logger.warn('Warning message')).not.toThrow();
      expect(() => logger.error('Error message')).not.toThrow();
    });
  });

  describe('OpenApiLoader', () => {
    it('should be instantiated correctly', () => {
      const loader = new OpenApiLoader(config, httpClient, cache);
      expect(loader).toBeDefined();
      expect(loader.getTools()).toBeInstanceOf(Map);
      expect(loader.getSpec()).toBeNull(); // Not loaded yet
    });
  });

  describe('ToolExecutor', () => {
    it('should be instantiated correctly', () => {
      const executor = new ToolExecutor(config, httpClient, cache);
      expect(executor).toBeDefined();
    });

    it('should validate required parameters', async () => {
      const executor = new ToolExecutor(config, httpClient, cache);
      const mockTool = {
        name: 'testTool',
        description: 'Test tool',
        method: 'get',
        path: '/test/{id}',
        parameters: [
          {
            name: 'id',
            required: true,
            type: 'string',
            location: 'path' as const,
          },
        ],
        responses: {},
      };

      await expect(executor.execute(mockTool, {})).rejects.toThrow(
        'Missing required parameters: id'
      );
    });
  });

  describe('ResourceHandler', () => {
    it('should list available resources', async () => {
      const loader = new OpenApiLoader(config, httpClient, cache);
      const handler = new ResourceHandler(loader);
      
      const resources = await handler.listResources();
      expect(resources).toBeInstanceOf(Array);
      expect(resources.length).toBeGreaterThan(0);
      
      // Check for expected resources
      const resourceUris = resources.map(r => r.uri);
      expect(resourceUris).toContain('openapi://specification');
      expect(resourceUris).toContain('openapi://endpoints');
      expect(resourceUris).toContain('openapi://schemas');
      expect(resourceUris).toContain('openapi://tools');
    });
  });

  describe('PromptHandler', () => {
    it('should list available prompts', () => {
      const handler = new PromptHandler();
      const prompts = handler.listPrompts();
      
      expect(prompts).toBeInstanceOf(Array);
      expect(prompts.length).toBeGreaterThan(0);
      
      // Check for expected prompts
      const promptNames = prompts.map(p => p.name);
      expect(promptNames).toContain('api-explorer');
      expect(promptNames).toContain('generate-client');
      expect(promptNames).toContain('test-scenario');
      expect(promptNames).toContain('api-documentation');
    });

    it('should generate prompt messages', () => {
      const handler = new PromptHandler();
      
      const explorerPrompt = handler.getPrompt('api-explorer', { endpoint: '/pet' });
      expect(explorerPrompt.messages).toHaveLength(1);
      expect(explorerPrompt.messages[0].content.text).toContain('/pet');
      
      const clientPrompt = handler.getPrompt('generate-client', { language: 'python' });
      expect(clientPrompt.messages[0].content.text).toContain('python');
    });

    it('should throw for unknown prompts', () => {
      const handler = new PromptHandler();
      expect(() => handler.getPrompt('unknown-prompt')).toThrow('Prompt not found');
    });
  });
}); 