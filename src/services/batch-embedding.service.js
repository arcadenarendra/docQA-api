import { generateDocumentEmbedding } from "./embedding.service.js";

import { retry } from "../utils/retry.js";

export async function generateBatchEmbeddings(
  chunks,
  { concurrency = 3 } = {},
) {
  if (!Array.isArray(chunks)) {
    throw new TypeError("Chunks must be an array");
  }

  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer");
  }

  if (chunks.length === 0) {
    return [];
  }

  const results = new Array(chunks.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const currentIndex = nextIndex++;

      if (currentIndex >= chunks.length) {
        return;
      }

      const chunk = chunks[currentIndex];

      try {
        const embedding = await retry(
          () => generateDocumentEmbedding(chunk.text),
          {
            retries: 3,
            initialDelay: 1000,
          },
        );

        results[currentIndex] = {
          chunkIndex: chunk.chunkIndex,
          text: chunk.text,
          characterCount: chunk.characterCount,
          startOffset: chunk.startOffset,
          endOffset: chunk.endOffset,
          embedding,
        };
      } catch (error) {
        throw new Error(
          `Failed to embed chunk ${chunk.chunkIndex}: ${error.message}`,
          { cause: error },
        );
      }
    }
  }

  const workerCount = Math.min(concurrency, chunks.length);

  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return results;
}
