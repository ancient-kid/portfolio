"use client";

import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

const conversation = [
  "$ whoami",
  "Second-year engineer focused on scalable AI-integrated systems.",
  "$ systems",
  "RAG retrieval architecture, API-layered services, and interface-level reliability patterns.",
  "$ logs",
  "- RAG Retrieval Accuracy Baseline\n- Three.js Render Budget Notes\n- CV Game Latency Log",
  "$ lab",
  "Local hosting on constrained hardware, phone-based web serving experiments, and hardening checks.",
  "$ stack",
  "TypeScript, Next.js, Python, vector databases, Three.js, and deployment automation workflows.",
  "$ teaching",
  "Taught mathematics for one year. Built structured explanation flow and communication clarity.",
  "$ contact",
  "Email: anrg.dev@gmail.com",
];

export function TerminalSection() {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [renderedLines, setRenderedLines] = useState<string[]>([]);
  const bodyRef = useRef<HTMLDivElement>(null);

  const activeLine = useMemo(() => conversation[lineIndex] ?? "", [lineIndex]);

  useEffect(() => {
    if (lineIndex >= conversation.length) return;

    const timeout = setTimeout(
      () => {
        const nextChar = activeLine.slice(0, charIndex + 1);

        setRenderedLines((prev) => {
          const next = [...prev];

          if (next[lineIndex] === undefined) {
            next[lineIndex] = nextChar;
          } else {
            next[lineIndex] = nextChar;
          }

          return next;
        });

        if (charIndex + 1 >= activeLine.length) {
          setLineIndex((prev) => prev + 1);
          setCharIndex(0);
          return;
        }

        setCharIndex((prev) => prev + 1);
      },
      lineIndex % 2 === 0 ? 30 : 14,
    );

    return () => clearTimeout(timeout);
  }, [activeLine, charIndex, lineIndex]);

  useEffect(() => {
    if (!bodyRef.current) return;
    bodyRef.current.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [renderedLines]);

  return (
    <section id="terminal" className="px-6 pb-24 pt-8 sm:px-10 lg:px-20 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#050505]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-xs text-white/80 sm:px-6">
          <span>anurag@portfolio ~ %</span>
          <span className="h-2 w-2 rounded-full bg-white/50" />
        </div>

        <div
          ref={bodyRef}
          className="h-72 overflow-y-auto px-5 py-5 font-mono text-sm leading-7 text-[#d7ffd7] sm:px-6"
        >
          {renderedLines.map((line, idx) => (
            <p key={`${line}-${idx}`} className="break-words whitespace-pre-line">
              {line}
            </p>
          ))}

          <p className="mt-3 text-white">
            &gt; Ask me anything
            <span className="ml-1 inline-block h-[1.05em] w-[8px] translate-y-[2px] animate-pulse bg-white" />
          </p>
        </div>
      </motion.div>
    </section>
  );
}
