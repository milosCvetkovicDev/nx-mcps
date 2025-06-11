import { OpenAPIV3 } from 'openapi-types';

export class SchemaValidator {
  /**
   * Validates a value against an OpenAPI schema
   */
  static validate(value: any, schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject, paramName: string): void {
    if ('$ref' in schema) {
      // For now, skip reference validation
      return;
    }

    const schemaObj = schema as OpenAPIV3.SchemaObject;

    // Check required
    if (value === undefined || value === null) {
      if (schemaObj.nullable === true || !schemaObj.required) {
        return;
      }
      throw new Error(`Parameter "${paramName}" is required`);
    }

    // Validate type
    switch (schemaObj.type) {
      case 'string':
        if (typeof value !== 'string') {
          throw new Error(`Parameter "${paramName}" must be a string`);
        }
        this.validateString(value, schemaObj, paramName);
        break;

      case 'number':
      case 'integer':
        if (typeof value !== 'number') {
          throw new Error(`Parameter "${paramName}" must be a number`);
        }
        this.validateNumber(value, schemaObj, paramName);
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          throw new Error(`Parameter "${paramName}" must be a boolean`);
        }
        break;

      case 'array':
        if (!Array.isArray(value)) {
          throw new Error(`Parameter "${paramName}" must be an array`);
        }
        this.validateArray(value, schemaObj, paramName);
        break;

      case 'object':
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          throw new Error(`Parameter "${paramName}" must be an object`);
        }
        this.validateObject(value, schemaObj, paramName);
        break;
    }
  }

  private static validateString(value: string, schema: OpenAPIV3.SchemaObject, paramName: string): void {
    // Check enum values
    if (schema.enum && !schema.enum.includes(value)) {
      throw new Error(`Parameter "${paramName}" must be one of: ${schema.enum.join(', ')}`);
    }

    // Check pattern
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        throw new Error(`Parameter "${paramName}" does not match pattern: ${schema.pattern}`);
      }
    }

    // Check length constraints
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      throw new Error(`Parameter "${paramName}" must be at least ${schema.minLength} characters long`);
    }
    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      throw new Error(`Parameter "${paramName}" must be at most ${schema.maxLength} characters long`);
    }
  }

  private static validateNumber(value: number, schema: OpenAPIV3.SchemaObject, paramName: string): void {
    // Check minimum/maximum
    if (schema.minimum !== undefined) {
      const isExclusive = schema.exclusiveMinimum === true;
      if (isExclusive ? value <= schema.minimum : value < schema.minimum) {
        throw new Error(`Parameter "${paramName}" must be ${isExclusive ? 'greater than' : 'at least'} ${schema.minimum}`);
      }
    }

    if (schema.maximum !== undefined) {
      const isExclusive = schema.exclusiveMaximum === true;
      if (isExclusive ? value >= schema.maximum : value > schema.maximum) {
        throw new Error(`Parameter "${paramName}" must be ${isExclusive ? 'less than' : 'at most'} ${schema.maximum}`);
      }
    }

    // Check integer
    if (schema.type === 'integer' && !Number.isInteger(value)) {
      throw new Error(`Parameter "${paramName}" must be an integer`);
    }
  }

  private static validateArray(value: any[], schema: OpenAPIV3.SchemaObject, paramName: string): void {
    // Cast to ArraySchemaObject for array-specific properties
    const arraySchema = schema as OpenAPIV3.ArraySchemaObject;
    
    // Check array constraints
    if (arraySchema.minItems !== undefined && value.length < arraySchema.minItems) {
      throw new Error(`Parameter "${paramName}" must have at least ${arraySchema.minItems} items`);
    }
    if (arraySchema.maxItems !== undefined && value.length > arraySchema.maxItems) {
      throw new Error(`Parameter "${paramName}" must have at most ${arraySchema.maxItems} items`);
    }

    // Validate array items
    if (arraySchema.items) {
      value.forEach((item, index) => {
        this.validate(item, arraySchema.items as OpenAPIV3.SchemaObject, `${paramName}[${index}]`);
      });
    }
  }

  private static validateObject(value: Record<string, any>, schema: OpenAPIV3.SchemaObject, paramName: string): void {
    // Check required properties
    if (schema.required) {
      for (const requiredProp of schema.required) {
        if (!(requiredProp in value)) {
          throw new Error(`Property "${requiredProp}" is required in "${paramName}"`);
        }
      }
    }

    // Validate properties
    if (schema.properties) {
      for (const [propName, propSchema] of Object.entries(schema.properties)) {
        if (propName in value) {
          this.validate(value[propName], propSchema, `${paramName}.${propName}`);
        }
      }
    }

    // Check additional properties
    if (schema.additionalProperties === false) {
      const definedProps = Object.keys(schema.properties || {});
      const extraProps = Object.keys(value).filter(key => !definedProps.includes(key));
      if (extraProps.length > 0) {
        throw new Error(`Unexpected properties in "${paramName}": ${extraProps.join(', ')}`);
      }
    }
  }
} 