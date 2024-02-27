import { IndexFlatL2 } from "faiss-node";
import { BaseVectorStore, SimilarVectorResult } from "./base";

interface FaissVectorStoreConfiguration {
  dimension: number;
}

export class FaissVectorStore extends BaseVectorStore {
  private dimension: number;
  private index: IndexFlatL2;
  private vectorPositionToQuery: Map<number, string>;
  private vectorPositionToVector: Map<number, number[]>;
  constructor(configuration: FaissVectorStoreConfiguration) {
    super();
    this.dimension = configuration.dimension;
    this.index = new IndexFlatL2(this.dimension);
    this.vectorPositionToQuery = new Map();
    this.vectorPositionToVector = new Map();
  }

  async getSimilarVector(
    vector: number[],
  ): Promise<SimilarVectorResult | null> {
    const totalVector = this.index.ntotal();
    if (totalVector < 1) return null;
    const results = this.index.search(vector, 1);
    const query = this.vectorPositionToQuery.get(results.labels[0]);
    const similarVector = this.vectorPositionToVector.get(results.labels[0]);
    if (!query || !similarVector) {
      return null;
    }

    return {
      vector: similarVector,
      query: query,
    };
  }

  async setVector(vector: number[], query: string): Promise<void> {
    if (vector.length !== this.dimension) {
      throw new Error(
        `Dimension of vector (${vector.length}) is not ${this.dimension}`,
      );
    }
    this.index.add(vector);
    const currentPosition = this.index.ntotal() - 1;
    this.vectorPositionToQuery.set(currentPosition, query);
    this.vectorPositionToVector.set(currentPosition, vector);
  }

  async deleteOldestVector(): Promise<void> {
    if (this.index.ntotal() < 1) return;
    this.index.removeIds([0]);
  }

  async size(): Promise<number> {
    return this.index.ntotal();
  }
}
