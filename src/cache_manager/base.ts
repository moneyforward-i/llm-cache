import {
  BaseCache,
  deserializeStoredGeneration,
  serializeGeneration,
} from "@langchain/core/caches";
import { Generation } from "@langchain/core/outputs";
import { BaseCacheStore } from "../cache_store/base";
import { BaseEmbedding } from "../embedding";
import { BaseVectorStore } from "../vector_store/base";

export enum CacheEvictionPolicy {
  // lru = "lru",
  fifo = "fifo",
}

interface CacheManagerConfiguration {
  cacheStore: BaseCacheStore;
  vectorStore: BaseVectorStore;
  embbeddings: BaseEmbedding;
  evictionPolicy: CacheEvictionPolicy;
  maxSize?: number;
}

export class CacheManager extends BaseCache {
  private _cacheStore: BaseCacheStore;
  private _vectorStore: BaseVectorStore;
  private _embeddings: BaseEmbedding;
  private _evictionPolicy: CacheEvictionPolicy;
  private _maxSize?: number;
  constructor(configuration: CacheManagerConfiguration) {
    super();
    this._cacheStore = configuration.cacheStore;
    this._vectorStore = configuration.vectorStore;
    this._embeddings = configuration.embbeddings;
    this._evictionPolicy = configuration.evictionPolicy;
    this._maxSize = configuration.maxSize;
  }

  // save data in both cache and vector store
  async update(
    prompt: string,
    llmKey: string,
    value: Generation[],
  ): Promise<void> {
    const embedddedQuery = await this._embeddings.embed(prompt);

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
        }

        await Promise.all([
          this._cacheStore.setCache(
            prompt,
            JSON.stringify(value.map(serializeGeneration)),
          ),
          this._vectorStore.setVector(embedddedQuery, prompt),
        ]);

        break;
      default:
        break;
    }
  }

  async lookup(prompt: string, llmKey: string): Promise<Generation[] | null> {
    const embedddedQuery = await this._embeddings.embed(prompt);
    const similarEmbeddedQuery =
      await this._vectorStore.getSimilarVector(embedddedQuery);
    if (similarEmbeddedQuery?.query) {
      const cachedResult = await this._cacheStore.getCache(
        similarEmbeddedQuery.query,
      );
      if (cachedResult)
        return JSON.parse(cachedResult).map(deserializeStoredGeneration);
    }

    return null;
  }
}
