import { Client } from "@elastic/elasticsearch";
import { BaseVectorStore, SimilarVectorResult } from "./base";

interface GetSimilarVectorResult {
  _score: number;
  _source: Record<string, any>;
}

interface ElasticSearchVectorStoreConfiguration {
  hostName: string;
  port: number;
  indexName: string;
  queryFieldName: string;
  vectorFieldName: string;
  defaultScoreThreshold?: number;
}

export class ElasticSearchVectorStore extends BaseVectorStore {
  private client: Client;
  private indexName: string;
  private vectorFieldName: string;
  private queryFieldName: string;
  private defaultScoreThreshold;
  constructor(configuration: ElasticSearchVectorStoreConfiguration) {
    super();
    this.client = new Client({
      node: `${configuration.hostName}:${configuration.port}`,
    });
    this.indexName = configuration.indexName;
    this.vectorFieldName = configuration.vectorFieldName;
    this.queryFieldName = configuration.queryFieldName;
    this.defaultScoreThreshold = configuration.defaultScoreThreshold || 0.9;
  }

  async getSimilarVector(
    vector: number[]
  ): Promise<SimilarVectorResult | null> {
    const result = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          script_score: {
            query: {
              match_all: {},
            },
            script: {
              source:
                "doc[params.vector_field_name].size() == 0 ? 0 : cosineSimilarity(params.query_vector, params.vector_field_name)",
              params: {
                query_vector: vector,
                vector_field_name: this.vectorFieldName,
              },
            },
          },
        },
      },
    });

    if (result.body.hits.hits.length === 0) {
      return null;
    }

    const similarVector = result.body.hits.hits.sort(
      (a: GetSimilarVectorResult, b: GetSimilarVectorResult) =>
        b._score - a._score
    )[0];

    if (similarVector["_score"] < this.defaultScoreThreshold) {
      return null;
    }

    return {
      vector: similarVector["_source"][this.vectorFieldName],
      query: similarVector["_source"][this.queryFieldName],
    };
  }

  async setVector(vector: number[], query: string): Promise<void> {
    await this.client.index({
      index: this.indexName,
      body: {
        [this.vectorFieldName]: vector,
        [this.queryFieldName]: query,
        createdAt: new Date(),
      },
    });
  }

  async deleteOldestVector(): Promise<void> {
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
