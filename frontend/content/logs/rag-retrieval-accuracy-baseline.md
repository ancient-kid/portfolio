# RAG Retrieval Accuracy Baseline

Defined a baseline retrieval system focused on answer relevance and citation reliability.

## Architecture Notes

- Source ingestion pipeline with normalized document cleaning.
- Chunking strategy tested with overlap windows and legal paragraph boundaries.
- Embedding generation performed as a versioned batch job.
- Vector index tuned for top-k recall before reranking.

## Evaluation Protocol

- Query set built from representative legal information prompts.
- Accuracy measured by retrieval coverage before final answer generation.
- Prompt structuring adjusted to keep context windows deterministic.

## Baseline Config

```ts
const retrievalConfig = {
  chunkSize: 700,
  chunkOverlap: 120,
  topK: 6,
  rerank: true,
};
```

## Result

Baseline improved retrieval consistency and reduced off-topic context in generation output.
