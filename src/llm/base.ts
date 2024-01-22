import { BaseEmbedding } from "../embedding/base";
import { CacheManager } from "../cache_manager/base";

export interface BaseLLMCacheConfiguration {
  embeddings: BaseEmbedding;
  cacheManager: CacheManager;
}

export abstract class BaseLLMCache {
  protected embeddings: BaseEmbedding;
  protected cacheManager: CacheManager;
  constructor(configuration: BaseLLMCacheConfiguration) {
    this.embeddings = configuration.embeddings;
    this.cacheManager = configuration.cacheManager;
  }
}
