import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Logger } from './logger.js';
import { Config } from './config.js';

export class HttpClient {
  private readonly client: AxiosInstance;
  private readonly logger = new Logger('HttpClient');
  private readonly maxRetries: number;
  private readonly retryDelay: number;

  constructor(config: Config) {
    this.maxRetries = config.maxRetries;
    this.retryDelay = config.retryDelay;

    this.client = axios.create({
      timeout: config.requestTimeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Petstore-API-MCP-Server/1.0',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug('HTTP Request', {
          method: config.method,
          url: config.url,
          params: config.params,
        });
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug('HTTP Response', {
          status: response.status,
          statusText: response.statusText,
          url: response.config.url,
        });
        return response;
      },
      (error) => {
        this.logger.error('HTTP Error Response', error, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
        });
        return Promise.reject(error);
      }
    );
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldRetry(error: any, attempt: number): boolean {
    if (attempt >= this.maxRetries) return false;

    // Retry on network errors or 5xx server errors
    if (!error.response) return true; // Network error
    
    const status = error.response.status;
    return status >= 500 && status < 600;
  }

  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.client.request<T>(config);
      } catch (error: any) {
        lastError = error;
        
        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }

        const delay = this.retryDelay * Math.pow(2, attempt); // Exponential backoff
        this.logger.warn(`Request failed, retrying...`, {
          attempt: attempt + 1,
          maxRetries: this.maxRetries,
          delay,
          error: error.message,
        });
        
        await this.delay(delay);
      }
    }

    throw lastError;
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'GET', url });
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'POST', url, data });
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PUT', url, data });
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'DELETE', url });
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({ ...config, method: 'PATCH', url, data });
  }
} 