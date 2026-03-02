"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { engineeringLogs } from "../logs/data";

export function EngineeringLogsSection() {
  return (
    <section id="logs" className="border-t border-white/[0.06] px-6 py-24 sm:px-10 lg:px-20 lg:py-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-[11px] uppercase tracking-[0.3em] text-white/55">Engineering Logs</h2>

        <div className="mt-8 space-y-6">
          {engineeringLogs.map((log, index) => (
            <motion.div
              key={log.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ opacity: 0.92, y: -2 }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.45, delay: index * 0.04, ease: "easeOut" }}
              className="py-1"
            >
              <h3 className="text-xl font-semibold tracking-[-0.01em] text-white">{log.title}</h3>
              <p className="mt-1 max-w-3xl text-sm text-white/65">{log.description}</p>
              <Link
                href={`/logs/${log.slug}`}
                className="mt-3 inline-flex text-[11px] uppercase tracking-[0.2em] text-white/80 transition hover:text-white"
              >
                Read Log →
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
