"use client";

import { motion } from "framer-motion";

const focusAreas = [
  "Data Structures & Algorithms",
  "Backend Systems Design",
  "Applied Machine Learning",
  "Scalable Web Infrastructure",
];

export function CurrentFocusSection() {
  return (
    <section id="focus" className="border-t border-white/[0.06] px-6 py-14 sm:px-10 lg:px-20 lg:py-18">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.35 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="mx-auto max-w-7xl py-2"
      >
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-white/55">Current Focus</h2>

        <ul className="mt-6 list-disc space-y-3 pl-5 text-sm text-white/82 sm:text-base">
          {focusAreas.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
