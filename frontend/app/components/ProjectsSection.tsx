"use client";

import { motion } from "framer-motion";

const projects = [
  {
    name: "NYAYASHASTRA",
    description:
      "AI-powered legal information retrieval system using RAG architecture.",
    emphasis:
      "Embedding pipeline, vector search, prompt structuring, retrieval accuracy.",
    repoUrl: "https://github.com/SatyamPandey-07/NYAYASHASTRA",
  },
  {
    name: "PORSCHE REVAMP",
    description: "Interactive Three.js-based product visualization system.",
    emphasis:
      "Scene optimization, animation control, render performance under load.",
    repoUrl: "https://github.com/ancient-kid/porsche_revv",
  },
  {
    name: "WEBCRICKET",
    description: "Real-time gesture-based interactive game using computer vision.",
    emphasis:
      "Frame processing, detection model integration, game state logic, latency handling.",
    repoUrl: "https://github.com/ancient-kid/WebCricket",
  },
];

export function ProjectsSection() {
  return (
    <section id="systems" className="border-t border-white/[0.06] px-6 py-24 sm:px-10 lg:px-20 lg:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex items-end justify-between gap-4">
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/50">Selected Systems</p>
          <p className="text-[10px] uppercase tracking-[0.24em] text-white/35">Architecture Focus</p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {projects.map((project, index) => (
          <motion.article
            key={project.name}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, delay: index * 0.08, ease: "easeOut" }}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050505]"
          >
            <div className="overflow-hidden border-b border-white/10">
              <div className="h-52 w-full origin-center bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_45%),linear-gradient(120deg,#0b0b0b,#111)] grayscale transition duration-500 group-hover:scale-[1.03] group-hover:grayscale-0 sm:h-56" />
            </div>

            <div className="flex flex-1 flex-col space-y-4 p-6 sm:p-8">
              <h2 className="text-3xl font-black tracking-[-0.02em] text-white sm:text-4xl">
                {project.name}
              </h2>
              <p className="max-w-2xl text-sm text-[#A0A0A0] sm:text-[15px]">
                {project.description}
              </p>
              <p className="max-w-2xl text-xs uppercase tracking-[0.14em] text-white/55 sm:text-[11px]">
                {project.emphasis}
              </p>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium uppercase tracking-[0.18em] text-white transition duration-200 group-hover:text-white/80"
              >
                View System →
              </a>
            </div>
          </motion.article>
        ))}
        </div>
      </div>
    </section>
  );
}
