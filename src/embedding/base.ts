export abstract class BaseEmbedding {
  abstract embed(prompt: string): Promise<number[]>;
}
