export interface SimilarVectorResult {
  vector: number[];
  query: string;
}

export abstract class BaseVectorStore {
  abstract getSimilarVector(
    vector: number[]
  ): Promise<SimilarVectorResult | null>;
  abstract setVector(vector: number[], query: string): Promise<void>;
  abstract deleteOldestVector(): Promise<void>;
  abstract size(): Promise<number>;
}
