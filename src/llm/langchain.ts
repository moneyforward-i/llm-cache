import { BaseLLM } from "langchain/llms/base";
import { Callbacks } from "langchain/dist/callbacks/manager";
import { BaseLLMCache, BaseLLMCacheConfiguration } from "./base";

export class LangchainCache extends BaseLLMCache {
  private _llm: BaseLLM;
  constructor(llm: BaseLLM, baseLLMConfiguration: BaseLLMCacheConfiguration) {
    super(baseLLMConfiguration);
    this._llm = llm;
  }

  async predict(
    text: string,
    options?: string[],
    callbacks?: Callbacks
  ): Promise<string> {
    // Exact match cache:
    const exactMatchCachedResult = await this.cacheManager.cacheStore.getCache(
      text
    );
    if (exactMatchCachedResult) return exactMatchCachedResult;

    // Similar vector cache:
    const start = Date.now();
    const embeddedText = await this.embeddings.embed(text);
    console.log("Dimension of embedding", embeddedText.length);
    const endEmbedding = Date.now();
    console.log(`Embedding time: ${endEmbedding - start}ms`);
    const similarEmbeddedText =
      await this.cacheManager.vectorStore.getSimilarVector(embeddedText);
    const endSearchingSimilarVector = Date.now();
    console.log(
      `Searching similar vector time: ${
        endSearchingSimilarVector - endEmbedding
      }ms`
    );

    console.log(`Similar query: ${similarEmbeddedText?.query}`);

    if (similarEmbeddedText?.vector) {
      const cachedResult = await this.cacheManager.cacheStore.getCache(
        similarEmbeddedText?.query
      );

      console.log(`Cached result: ${cachedResult}`);
      if (cachedResult) {
        return cachedResult;
      }
      const endGetCaching = Date.now();
      console.log(
        `Get caching time: ${endGetCaching - endSearchingSimilarVector}ms`
      );
    }

    // Without caching
    const result = await this._llm.predict(text, options, callbacks);

    const endPrediction = Date.now();
    console.log(
      `Prediction Time: ${endPrediction - endSearchingSimilarVector}ms`
    );

    await this.cacheManager.save(text, embeddedText, result);
    return result;
  }
}
