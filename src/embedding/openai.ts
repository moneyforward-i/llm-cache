import { OpenAIEmbeddings } from "@langchain/openai";
import { BaseEmbedding } from "./base";

export class OpenAIEmbedding extends BaseEmbedding {
  private openaiEmbeddings: OpenAIEmbeddings;
  constructor(openAIApiKey: string, maxConcurrency: number) {
    super();
    this.openaiEmbeddings = new OpenAIEmbeddings({
      openAIApiKey: openAIApiKey,
      maxConcurrency: maxConcurrency,
    });
  }

  async embed(prompt: string): Promise<number[]> {
    return await this.openaiEmbeddings.embedQuery(prompt);
  }
}
