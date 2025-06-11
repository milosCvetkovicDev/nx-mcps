export interface Prompt {
  name: string;
  description: string;
  arguments?: Array<{
    name: string;
    description: string;
    required: boolean;
  }>;
}

export interface PromptMessage {
  role: 'user' | 'assistant' | 'system';
  content: {
    type: 'text';
    text: string;
  };
}

export class PromptHandler {
  listPrompts(): Prompt[] {
    return [
      {
        name: 'api-explorer',
        description: 'Explore and test API endpoints interactively',
        arguments: [
          {
            name: 'endpoint',
            description: 'The API endpoint to explore (e.g., /pet, /store/order)',
            required: false,
          },
        ],
      },
      {
        name: 'generate-client',
        description: 'Generate code to interact with the API',
        arguments: [
          {
            name: 'language',
            description: 'Programming language (e.g., javascript, python, java, typescript)',
            required: true,
          },
          {
            name: 'operation',
            description: 'Specific operation to generate code for',
            required: false,
          },
        ],
      },
      {
        name: 'test-scenario',
        description: 'Create and execute test scenarios for the API',
        arguments: [
          {
            name: 'scenario',
            description: 'Type of scenario (e.g., crud-operations, error-handling, performance)',
            required: true,
          },
        ],
      },
      {
        name: 'api-documentation',
        description: 'Generate human-readable documentation for API endpoints',
        arguments: [
          {
            name: 'format',
            description: 'Documentation format (e.g., markdown, html, plain)',
            required: false,
          },
          {
            name: 'endpoint',
            description: 'Specific endpoint to document (optional)',
            required: false,
          },
        ],
      },
    ];
  }

  getPrompt(name: string, args?: Record<string, any>): {
    description: string;
    messages: PromptMessage[];
  } {
    switch (name) {
      case 'api-explorer':
        return this.getApiExplorerPrompt(args);
      
      case 'generate-client':
        return this.getGenerateClientPrompt(args);
      
      case 'test-scenario':
        return this.getTestScenarioPrompt(args);
      
      case 'api-documentation':
        return this.getApiDocumentationPrompt(args);
      
      default:
        throw new Error(`Prompt not found: ${name}`);
    }
  }

  private getApiExplorerPrompt(args?: Record<string, any>): {
    description: string;
    messages: PromptMessage[];
  } {
    const endpoint = args?.endpoint;
    const text = endpoint
      ? `Help me explore and test the ${endpoint} endpoint. Show me:
1. What operations are available for this endpoint
2. What parameters each operation requires
3. Example requests and expected responses
4. Help me make test requests with sample data

Let's start by listing the available operations for ${endpoint}.`
      : `Help me explore the Petstore API. Please:
1. Show me the main categories of endpoints available
2. List the most commonly used operations
3. Guide me through making my first API request
4. Explain how to handle authentication if required

What would you like to explore first?`;

    return {
      description: 'Interactive API exploration',
      messages: [
        {
          role: 'user',
          content: { type: 'text', text },
        },
      ],
    };
  }

  private getGenerateClientPrompt(args?: Record<string, any>): {
    description: string;
    messages: PromptMessage[];
  } {
    const language = args?.language || 'javascript';
    const operation = args?.operation;
    
    const text = operation
      ? `Generate ${language} code to call the ${operation} operation from the Petstore API. Please include:
1. Proper error handling
2. Type definitions (if applicable for the language)
3. Example usage with sample data
4. Any necessary imports or dependencies
5. Comments explaining the code

Make the code production-ready and follow best practices for ${language}.`
      : `Generate a complete ${language} client library for the Petstore API. Include:
1. A main client class with methods for all available operations
2. Proper error handling and retry logic
3. Type definitions (if applicable)
4. Configuration options (base URL, timeout, etc.)
5. Comprehensive example usage
6. Installation instructions if any dependencies are needed

Make it production-ready and follow ${language} best practices.`;

    return {
      description: 'Generate API client code',
      messages: [
        {
          role: 'user',
          content: { type: 'text', text },
        },
      ],
    };
  }

  private getTestScenarioPrompt(args?: Record<string, any>): {
    description: string;
    messages: PromptMessage[];
  } {
    const scenario = args?.scenario || 'crud-operations';
    
    const scenarioPrompts: Record<string, string> = {
      'crud-operations': `Create a comprehensive test scenario for CRUD operations on the Petstore API:
1. Create a new pet with all required fields
2. Retrieve the created pet by ID
3. Update the pet's information
4. List pets by status
5. Delete the pet
6. Verify the pet was deleted

For each step, show the request, expected response, and any assertions to validate the operation.`,
      
      'error-handling': `Create test scenarios to verify error handling in the Petstore API:
1. Test invalid input data (missing required fields, wrong data types)
2. Test non-existent resource access (404 errors)
3. Test invalid HTTP methods
4. Test malformed requests
5. Test boundary conditions (very long strings, negative numbers, etc.)

Show how the API handles each error case and what clients should expect.`,
      
      'performance': `Create performance test scenarios for the Petstore API:
1. Test response times for different endpoints
2. Test handling of large payloads
3. Test pagination with large datasets
4. Test concurrent requests
5. Identify potential bottlenecks

Provide recommendations for optimal API usage patterns.`,
    };

    const text = scenarioPrompts[scenario] || scenarioPrompts['crud-operations'];

    return {
      description: 'Create and execute test scenarios',
      messages: [
        {
          role: 'user',
          content: { type: 'text', text },
        },
      ],
    };
  }

  private getApiDocumentationPrompt(args?: Record<string, any>): {
    description: string;
    messages: PromptMessage[];
  } {
    const format = args?.format || 'markdown';
    const endpoint = args?.endpoint;
    
    const text = endpoint
      ? `Generate ${format} documentation for the ${endpoint} endpoint. Include:
1. Endpoint description and purpose
2. HTTP method(s) supported
3. Request parameters (path, query, headers, body)
4. Request/response examples
5. Error codes and their meanings
6. Usage notes and best practices

Make it clear and developer-friendly.`
      : `Generate comprehensive ${format} documentation for the entire Petstore API. Structure it with:
1. API Overview and base URL
2. Authentication (if applicable)
3. Common headers and conventions
4. Endpoints grouped by resource type
5. Detailed documentation for each endpoint
6. Data models and schemas
7. Error handling guide
8. Example workflows
9. Rate limiting and best practices

Make it suitable for developers who are new to the API.`;

    return {
      description: 'Generate API documentation',
      messages: [
        {
          role: 'user',
          content: { type: 'text', text },
        },
      ],
    };
  }
} 