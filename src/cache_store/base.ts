export abstract class BaseCacheStore {
  abstract getCache(key: string): Promise<string | null>;
  abstract setCache(key: string, value: string): Promise<void>;
  abstract deleteByKey(key: string): Promise<void>;
  abstract deleteOldestItem(): Promise<void>;
  abstract size(): Promise<number>;
}
