export type EngineeringLog = {
  slug: string;
  title: string;
  description: string;
};

export const engineeringLogs: EngineeringLog[] = [
  {
    slug: "rag-retrieval-accuracy-baseline",
    title: "RAG Retrieval Accuracy Baseline",
    description: "Establishing chunking strategy, embedding selection, and retrieval-quality checkpoints.",
  },
  {
    slug: "threejs-render-budget-notes",
    title: "Three.js Render Budget Notes",
    description: "Profiling frame-time bottlenecks and applying scene-level optimization constraints.",
  },
  {
    slug: "cv-game-latency-log",
    title: "CV Game Latency Log",
    description: "Measuring frame pipeline latency and stabilizing game state under input variance.",
  },
];
