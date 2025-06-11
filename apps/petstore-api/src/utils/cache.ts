import { Logger } from './logger.js';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class Cache<T = any> {
  private readonly cache = new Map<string, CacheEntry<T>>();
  private readonly logger = new Logger('Cache');
  private readonly defaultTTL: number;

  constructor(defaultTTL = 300000) { // 5 minutes default
    this.defaultTTL = defaultTTL;
    
    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  set(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    
    this.cache.set(key, entry);
    this.logger.debug(`Cache set: ${key}`, { ttl: entry.ttl });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      this.logger.debug(`Cache expired: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    const result = this.cache.delete(key);
    if (result) {
      this.logger.debug(`Cache deleted: ${key}`);
    }
    return result;
  }

  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.logger.info(`Cache cleared`, { entriesRemoved: size });
  }

  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`Cache cleanup completed`, { entriesRemoved: removed });
    }
  }

  size(): number {
    return this.cache.size;
  }
} 