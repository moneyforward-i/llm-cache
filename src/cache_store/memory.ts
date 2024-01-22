import { BaseCacheStore } from "./base";

export class MemoryCacheStore extends BaseCacheStore {
  private map: Map<string, string>;
  constructor() {
    super();
    this.map = new Map();
  }

  async setCache(key: string, value: string): Promise<void> {
    this.map.set(key, value);
  }
  async getCache(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }

  async deleteByKey(key: string): Promise<void> {
    this.map.delete(key);
  }

  async deleteOldestItem(): Promise<void> {
    const keys = this.map.keys();
    const firstKey = keys.next().value;
    this.deleteByKey(firstKey);
  }

  async size(): Promise<number> {
    return this.map.size;
  }
}
