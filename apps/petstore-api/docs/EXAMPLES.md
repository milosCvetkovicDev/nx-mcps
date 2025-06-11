# Petstore API MCP Server - Examples & Use Cases

This guide provides practical examples and use cases for the Petstore API MCP Server in both Claude Desktop and Cursor IDE.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Claude Desktop Examples](#claude-desktop-examples)
- [Cursor IDE Examples](#cursor-ide-examples)
- [Advanced Scenarios](#advanced-scenarios)
- [Integration Patterns](#integration-patterns)

## Basic Examples

### Pet Management

#### Finding Pets

**In Claude:**
```
"Show me all available pets in the store"
```
Claude will use the `findPetsByStatus` tool with `status: "available"`

**In Cursor:**
```
@petstore-api find all pets with status pending
```

#### Creating a New Pet

**In Claude:**
```
"Add a new dog named Max to the store. He's a golden retriever and is available for adoption."
```

Claude will use the `addPet` tool with:
```json
{
  "name": "Max",
  "category": {
    "id": 1,
    "name": "Dogs"
  },
  "photoUrls": ["string"],
  "tags": [
    {
      "id": 0,
      "name": "golden-retriever"
    }
  ],
  "status": "available"
}
```

**In Cursor:**
```
@petstore-api create a TypeScript function to add a new pet

// Result:
async function addNewPet(petData: Pet): Promise<Pet> {
  // Uses the addPet tool
  const result = await mcpClient.callTool('addPet', {
    body: petData
  });
  return JSON.parse(result.content[0].text);
}
```

### Store Operations

#### Checking Inventory

**In Claude:**
```
"What's the current inventory of the pet store?"
```
Claude will use the `getInventory` tool

**In Cursor:**
```
@petstore-api write a function to check store inventory levels
```

#### Placing an Order

**In Claude:**
```
"Place an order for pet ID 123 with quantity 2"
```

Claude will use the `placeOrder` tool with:
```json
{
  "id": 0,
  "petId": 123,
  "quantity": 2,
  "shipDate": "2024-01-01T00:00:00.000Z",
  "status": "placed",
  "complete": false
}
```

## Claude Desktop Examples

### Example 1: Complete Pet CRUD Workflow

```
User: "I want to manage pets in the store. First, show me all pets."

Claude: I'll help you manage pets in the store. Let me start by showing you all the current pets.

[Calls findPetsByStatus with status: "available"]

Here are all the available pets in the store:
- Buddy (ID: 1) - Dog, Status: available
- Mittens (ID: 2) - Cat, Status: available
- ...

User: "Add a new cat named Whiskers"

Claude: I'll add Whiskers as a new cat to the store.

[Calls addPet tool]

Successfully added Whiskers to the store with ID: 12345.

User: "Now update Whiskers' status to 'sold'"

Claude: I'll update Whiskers' status to sold.

[Calls updatePet tool with petId: 12345, status: "sold"]

Successfully updated Whiskers' status to "sold".
```

### Example 2: API Documentation Generation

```
User: "Generate comprehensive documentation for the pet endpoints"

Claude: I'll generate comprehensive documentation for the pet endpoints using the API documentation prompt.

[Uses api-documentation prompt with endpoint: "pet", format: "markdown"]

# Pet Endpoints Documentation

## Overview
The Pet endpoints allow you to manage pets in the Petstore.

## Endpoints

### GET /pet/{petId}
Retrieves a pet by ID.

**Parameters:**
- `petId` (path, required): ID of pet to return

**Responses:**
- 200: Successful operation
- 400: Invalid ID supplied
- 404: Pet not found

### POST /pet
Adds a new pet to the store.

**Request Body:**
```json
{
  "name": "string",
  "category": {
    "id": 0,
    "name": "string"
  },
  "photoUrls": ["string"],
  "tags": [{"id": 0, "name": "string"}],
  "status": "available"
}
```
[... continues with all endpoints ...]
```

### Example 3: Client Code Generation

```
User: "Generate a Python client for interacting with the pet API"

Claude: I'll generate a Python client for the pet API endpoints.

[Uses generate-client prompt with language: "python", endpoints: "pet"]

Here's a Python client for the Petstore pet API:

```python
import requests
from typing import List, Optional, Dict, Any

class PetstoreClient:
    def __init__(self, base_url: str = "https://petstore3.swagger.io/api/v3"):
        self.base_url = base_url
        self.session = requests.Session()
    
    def add_pet(self, pet_data: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new pet to the store"""
        response = self.session.post(
            f"{self.base_url}/pet",
            json=pet_data
        )
        response.raise_for_status()
        return response.json()
    
    def get_pet_by_id(self, pet_id: int) -> Dict[str, Any]:
        """Find pet by ID"""
        response = self.session.get(f"{self.base_url}/pet/{pet_id}")
        response.raise_for_status()
        return response.json()
    
    def find_pets_by_status(self, status: str) -> List[Dict[str, Any]]:
        """Find pets by status"""
        response = self.session.get(
            f"{self.base_url}/pet/findByStatus",
            params={"status": status}
        )
        response.raise_for_status()
        return response.json()
    
    # ... additional methods ...

# Example usage:
client = PetstoreClient()
available_pets = client.find_pets_by_status("available")
```
```

## Cursor IDE Examples

### Example 1: Building a Pet Management System

```
@petstore-api create a complete TypeScript module for pet management with error handling

// Result: Cursor generates
import { PetstoreApiClient } from './client';

export class PetManager {
  private client: PetstoreApiClient;

  constructor(baseUrl?: string) {
    this.client = new PetstoreApiClient(baseUrl);
  }

  async getAllAvailablePets(): Promise<Pet[]> {
    try {
      const result = await this.client.callTool('findPetsByStatus', {
        status: 'available'
      });
      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('Failed to fetch pets:', error);
      throw new Error('Unable to retrieve available pets');
    }
  }

  async addPet(petData: Omit<Pet, 'id'>): Promise<Pet> {
    try {
      const result = await this.client.callTool('addPet', {
        body: petData
      });
      return JSON.parse(result.content[0].text);
    } catch (error) {
      console.error('Failed to add pet:', error);
      throw new Error('Unable to add new pet');
    }
  }

  // ... more methods
}
```

### Example 2: Test Suite Generation

```
@petstore-api generate Jest tests for all pet operations

// Result: Cursor generates
describe('Petstore API - Pet Operations', () => {
  let petId: number;

  describe('POST /pet', () => {
    it('should create a new pet', async () => {
      const newPet = {
        name: 'Test Pet',
        category: { id: 1, name: 'Dogs' },
        photoUrls: ['http://example.com/photo.jpg'],
        tags: [{ id: 1, name: 'test' }],
        status: 'available'
      };

      const result = await api.addPet(newPet);
      
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(newPet.name);
      expect(result.status).toBe(newPet.status);
      
      petId = result.id;
    });
  });

  describe('GET /pet/{petId}', () => {
    it('should retrieve a pet by ID', async () => {
      const result = await api.getPetById(petId);
      
      expect(result.id).toBe(petId);
      expect(result).toHaveProperty('name');
    });

    it('should return 404 for non-existent pet', async () => {
      await expect(api.getPetById(999999999)).rejects.toThrow('404');
    });
  });

  // ... more tests
});
```

### Example 3: API Integration Service

```
@petstore-api create a NestJS service for pet operations

// Result: Cursor generates
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { MCP } from '@modelcontextprotocol/sdk';

@Injectable()
export class PetService {
  private mcp: MCP;

  constructor() {
    this.mcp = new MCP({
      server: 'petstore-api'
    });
  }

  async findAvailablePets(): Promise<Pet[]> {
    try {
      const result = await this.mcp.callTool('findPetsByStatus', {
        status: 'available'
      });
      return JSON.parse(result.content[0].text);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch pets',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createPet(createPetDto: CreatePetDto): Promise<Pet> {
    try {
      const result = await this.mcp.callTool('addPet', {
        body: createPetDto
      });
      return JSON.parse(result.content[0].text);
    } catch (error) {
      throw new HttpException(
        'Failed to create pet',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ... more methods
}
```

## Advanced Scenarios

### Scenario 1: Bulk Operations

**In Claude:**
```
User: "I need to update the status of all pets with tag 'adoption-ready' to 'available'"

Claude: I'll help you update all pets with the 'adoption-ready' tag to 'available' status. Let me first find these pets and then update them.

[Step 1: Calls findPetsByTags with tags: ["adoption-ready"]]

Found 5 pets with the 'adoption-ready' tag:
- Pet ID 101: Max (currently pending)
- Pet ID 102: Luna (currently pending)
- Pet ID 103: Charlie (currently sold)
- Pet ID 104: Bella (currently pending)
- Pet ID 105: Rocky (currently pending)

Now I'll update each pet's status to 'available':

[Step 2: Calls updatePet for each pet ID]

✓ Updated Max (ID: 101) - Status: available
✓ Updated Luna (ID: 102) - Status: available
✓ Updated Charlie (ID: 103) - Status: available
✓ Updated Bella (ID: 104) - Status: available
✓ Updated Rocky (ID: 105) - Status: available

All 5 pets have been successfully updated to 'available' status.
```

### Scenario 2: Data Analysis

**In Claude:**
```
User: "Analyze the pet inventory and give me insights"

Claude: Let me analyze the pet inventory for you.

[Calls getInventory tool]

Based on the inventory data, here are the key insights:

## Pet Inventory Analysis

### Status Distribution:
- Available: 45 pets (60%)
- Pending: 20 pets (27%)
- Sold: 10 pets (13%)

### Category Breakdown:
- Dogs: 35 pets (47%)
- Cats: 28 pets (37%)
- Birds: 8 pets (11%)
- Other: 4 pets (5%)

### Key Observations:
1. **High Availability**: 60% of pets are available, indicating good stock
2. **Dogs Dominate**: Nearly half of all pets are dogs
3. **Quick Turnover**: Only 13% marked as sold suggests fast adoption
4. **Pending Orders**: 27% in pending status may need follow-up

### Recommendations:
- Consider restocking birds and exotic pets
- Follow up on pending orders to convert to sales
- Marketing opportunity for the high number of available pets
```

### Scenario 3: API Migration Script

**In Cursor:**
```
@petstore-api create a migration script to move pets from one instance to another

// Result:
import axios from 'axios';

interface MigrationConfig {
  sourceUrl: string;
  targetUrl: string;
  batchSize: number;
}

class PetstoreMigration {
  constructor(private config: MigrationConfig) {}

  async migrate(): Promise<void> {
    console.log('Starting pet migration...');
    
    try {
      // Fetch all pets from source
      const sourcePets = await this.fetchAllPets(this.config.sourceUrl);
      console.log(`Found ${sourcePets.length} pets to migrate`);

      // Migrate in batches
      const batches = this.createBatches(sourcePets, this.config.batchSize);
      
      for (let i = 0; i < batches.length; i++) {
        console.log(`Processing batch ${i + 1}/${batches.length}`);
        await this.migrateBatch(batches[i]);
      }

      console.log('Migration completed successfully!');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  private async fetchAllPets(baseUrl: string): Promise<Pet[]> {
    const statuses = ['available', 'pending', 'sold'];
    const allPets: Pet[] = [];

    for (const status of statuses) {
      const response = await axios.get(`${baseUrl}/pet/findByStatus`, {
        params: { status }
      });
      allPets.push(...response.data);
    }

    return allPets;
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private async migrateBatch(pets: Pet[]): Promise<void> {
    const promises = pets.map(pet => this.migratePet(pet));
    await Promise.all(promises);
  }

  private async migratePet(pet: Pet): Promise<void> {
    try {
      await axios.post(`${this.config.targetUrl}/pet`, pet);
      console.log(`✓ Migrated pet: ${pet.name} (ID: ${pet.id})`);
    } catch (error) {
      console.error(`✗ Failed to migrate pet ${pet.id}:`, error.message);
    }
  }
}

// Usage
const migration = new PetstoreMigration({
  sourceUrl: 'https://old-petstore.example.com/api/v3',
  targetUrl: 'https://new-petstore.example.com/api/v3',
  batchSize: 10
});

migration.migrate();
```

## Integration Patterns

### Pattern 1: Event-Driven Architecture

```typescript
// Using MCP with event emitters
import { EventEmitter } from 'events';

class PetEventSystem extends EventEmitter {
  constructor(private mcpClient: MCPClient) {
    super();
    this.setupListeners();
  }

  private setupListeners() {
    this.on('pet:create', async (petData) => {
      const result = await this.mcpClient.callTool('addPet', { body: petData });
      this.emit('pet:created', JSON.parse(result.content[0].text));
    });

    this.on('pet:statusChange', async ({ petId, status }) => {
      const result = await this.mcpClient.callTool('updatePet', {
        body: { id: petId, status }
      });
      this.emit('pet:updated', JSON.parse(result.content[0].text));
    });
  }
}
```

### Pattern 2: Caching Layer

```typescript
// Implementing a caching layer over MCP
class CachedPetStore {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private TTL = 5 * 60 * 1000; // 5 minutes

  constructor(private mcpClient: MCPClient) {}

  async getPetById(petId: number): Promise<Pet> {
    const cacheKey = `pet:${petId}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }

    const result = await this.mcpClient.callTool('getPetById', { petId });
    const pet = JSON.parse(result.content[0].text);

    this.cache.set(cacheKey, { data: pet, timestamp: Date.now() });
    return pet;
  }

  invalidateCache(petId?: number) {
    if (petId) {
      this.cache.delete(`pet:${petId}`);
    } else {
      this.cache.clear();
    }
  }
}
```

### Pattern 3: Retry and Circuit Breaker

```typescript
// Implementing retry logic with circuit breaker
class ResilientPetClient {
  private failures = 0;
  private circuitOpen = false;
  private readonly maxFailures = 5;

  constructor(private mcpClient: MCPClient) {}

  async callWithRetry(toolName: string, args: any, maxRetries = 3): Promise<any> {
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open');
    }

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const result = await this.mcpClient.callTool(toolName, args);
        this.failures = 0; // Reset on success
        return JSON.parse(result.content[0].text);
      } catch (error) {
        if (i === maxRetries) {
          this.failures++;
          if (this.failures >= this.maxFailures) {
            this.circuitOpen = true;
            setTimeout(() => {
              this.circuitOpen = false;
              this.failures = 0;
            }, 60000); // Reset after 1 minute
          }
          throw error;
        }
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

## Tips and Best Practices

### For Claude Desktop

1. **Be Specific**: Provide clear instructions about what you want
2. **Iterative Approach**: Build complex operations step by step
3. **Ask for Explanations**: Claude can explain what each API call does
4. **Request Validation**: Ask Claude to validate data before API calls

### For Cursor IDE

1. **Use Comments**: Add comments about expected MCP behavior
2. **Type Safety**: Always request TypeScript interfaces
3. **Error Handling**: Ask for comprehensive error handling
4. **Testing**: Request unit tests alongside implementations

### General Best Practices

1. **Batch Operations**: Group multiple operations when possible
2. **Cache Responses**: Implement caching for read-heavy operations
3. **Handle Errors**: Always implement proper error handling
4. **Monitor Performance**: Track API response times
5. **Document Usage**: Keep examples of successful integrations

## Conclusion

The Petstore API MCP Server provides powerful capabilities for both conversational AI (Claude) and code-focused AI (Cursor). By following these examples and patterns, you can build robust integrations that leverage the full power of the MCP protocol. 