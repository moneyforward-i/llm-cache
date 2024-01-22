import { BaseCacheStore } from "../cache_store/base";
import { BaseVectorStore } from "../vector_store/base";

export enum CacheEvictionPolicy {
  // lru = "lru",
  fifo = "fifo",
}

interface CacheManagerConfiguration {
  cacheStore: BaseCacheStore;
  vectorStore: BaseVectorStore;
  evictionPolicy: CacheEvictionPolicy;
  maxSize?: number;
}

export class CacheManager {
  private _cacheStore: BaseCacheStore;
  private _vectorStore: BaseVectorStore;
  private _evictionPolicy: CacheEvictionPolicy;
  private _maxSize?: number;
  constructor(configuration: CacheManagerConfiguration) {
    this._cacheStore = configuration.cacheStore;
    this._vectorStore = configuration.vectorStore;
    this._evictionPolicy = configuration.evictionPolicy;
    this._maxSize = configuration.maxSize;
  }

  // save data in both cache and vector store
  async save(query: string, embedddedQuery: number[], result: string) {
    // total size of cache
    switch (this._evictionPolicy) {
      case CacheEvictionPolicy.fifo:
        if (this._maxSize) {
          const cacheSize = await this._cacheStore.size();
          if (cacheSize >= this._maxSize) {
            // Delete the oldest item from cacheStore and vectorStore
            await Promise.all([
              this._cacheStore.deleteOldestItem(),
              this._vectorStore.deleteOldestVector(),
            ]);
          }

          await Promise.all([
            this._cacheStore.setCache(query, result),
            this._vectorStore.setVector(embedddedQuery, query),
          ]);
        } else {
          await Promise.all([
            this._cacheStore.setCache(query, result),
            this._vectorStore.setVector(embedddedQuery, query),
          ]);
        }
        break;
      default:
        break;
    }
  }

  public get cacheStore(): BaseCacheStore {
    return this._cacheStore;
  }

  public get vectorStore(): BaseVectorStore {
    return this._vectorStore;
  }
}
