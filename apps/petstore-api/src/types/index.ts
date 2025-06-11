import { OpenAPIV3 } from 'openapi-types';

export interface ToolParameter {
  name: string;
  description?: string;
  required: boolean;
  type: string;
  location: 'path' | 'query' | 'header' | 'body';
  schema?: any;
}

export interface ApiTool {
  name: string;
  description: string;
  method: string;
  path: string;
  parameters: ToolParameter[];
  security?: any[];
  requestBody?: any;
  responses: any;
}

export interface ApiResponse<T = any> {
  status: number;
  statusText: string;
  headers: Record<string, any>;
  data: T;
}

export interface ErrorResponse {
  error: string;
  details?: any;
  status?: number;
}

export type OpenAPIDocument = OpenAPIV3.Document; 