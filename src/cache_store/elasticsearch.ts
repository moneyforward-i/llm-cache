import { Client } from "@elastic/elasticsearch";
import { BaseCacheStore } from "./base";

interface ElasticSearchCacheStoreConfiguration {
  hostName: string;
  port: number;
  indexName: string;
  cacheKeyFieldName: string;
  cacheValueFieldName: string;
}

export class ElasticSearchCacheStore extends BaseCacheStore {
  private client: Client;
  private indexName: string;
  private cacheKeyFieldName: string;
  private cacheValueFieldName: string;
  constructor(configuration: ElasticSearchCacheStoreConfiguration) {
    super();
    this.client = new Client({
      node: `${configuration.hostName}:${configuration.port}`,
    });
    this.indexName = configuration.indexName;
    this.cacheKeyFieldName = configuration.cacheKeyFieldName;
    this.cacheValueFieldName = configuration.cacheValueFieldName;
  }

  async setCache(key: string, value: string): Promise<void> {
    await this.client.index({
      index: this.indexName,
      body: {
        [this.cacheKeyFieldName]: key,
        [this.cacheValueFieldName]: value,
        createdAt: new Date(),
      },
    });
  }
  async getCache(key: string): Promise<string | null> {
    const result = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          match: {
            [this.cacheKeyFieldName]: key,
          },
        },
      },
    });

    if (result.body.hits.hits.length === 0) {
      return null;
    }

    return result.body.hits.hits[0]._source[this.cacheValueFieldName];
  }

  async deleteByKey(key: string): Promise<void> {
    await this.client.deleteByQuery({
      index: this.indexName,
      body: {
        query: {
          match: {
            [this.cacheKeyFieldName]: key,
          },
        },
      },
    });
  }

  async deleteOldestItem(): Promise<void> {
    await this.client.deleteByQuery({
      index: this.indexName,
      body: {
        query: {
          match_all: {},
        },
        max_docs: 1,
      },
      sort: ["createdAt:asc"],
    });
  }

  async size(): Promise<number> {
    const result = await this.client.count({
      index: this.indexName,
    });
    return result.body.count;
  }
}
