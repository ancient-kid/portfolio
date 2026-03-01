"use client";

import { motion } from "framer-motion";

const labItems = [
  {
    title: "Old Laptop Hosting",
    description: "Deploying production-like web services on constrained local hardware.",
  },
  {
    title: "Phone as Web Server",
    description: "Experimental reverse-proxy routing and local endpoint exposure.",
  },
  {
    title: "Local Deployment Chain",
    description: "Containerized local releases with repeatable startup and rollback flow.",
  },
  {
    title: "Baseline Hardening",
    description: "Process isolation, update hygiene, and network surface reduction tests.",
  },
];

export function SystemLabSection() {
  return (
    <section id="lab" className="px-6 pb-12 pt-2 sm:px-10 lg:px-20 lg:pb-16">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-white/55">System Lab</h2>

        <div className="mt-8 grid grid-cols-1 gap-x-10 gap-y-6 md:grid-cols-2">
          {labItems.map((item, index) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
              className="py-1"
            >
              <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-white/90">
                {item.title}
              </h3>
              <p className="mt-2 text-sm text-white/65">{item.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
