"use client";

import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const smoothX = useSpring(mouseX, { stiffness: 60, damping: 16 });
  const smoothY = useSpring(mouseY, { stiffness: 60, damping: 16 });

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.975]);

  const translate = useMotionTemplate`translate3d(${smoothX}px, ${smoothY}px, 0)`;

  useEffect(() => {
    const handleMove = (event: MouseEvent) => {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      mouseX.set((event.clientX - centerX) * 0.01);
      mouseY.set((event.clientY - centerY) * 0.01);
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [mouseX, mouseY]);

  return (
    <motion.section
      ref={sectionRef}
      style={{ opacity: heroOpacity, scale: heroScale }}
      className="relative flex min-h-screen items-center overflow-hidden px-6 py-16 sm:px-10 lg:px-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.5)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
      <div className="pointer-events-none absolute left-[28%] top-[42%] h-[58vh] w-[58vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_60%)] blur-3xl" />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-12 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <motion.h1
            style={{ transform: translate }}
            whileHover={{
              scale: 1.01,
              letterSpacing: "0.02em",
              textShadow: "0 0 22px rgba(255,255,255,0.25)",
            }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="select-none text-[clamp(4.25rem,16vw,13rem)] font-black uppercase leading-[0.85] tracking-[-0.045em] text-white"
          >
            ANRG.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
            className="mt-7 max-w-xl text-[11px] uppercase tracking-[0.32em] text-white/85 sm:text-xs"
          >
            Systems • AI • Engineering
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
            className="mt-3 max-w-2xl text-sm leading-7 text-white/65 sm:text-base"
          >
            Building scalable systems integrating intelligence, backend architecture,
            and interface precision.
          </motion.p>

          <nav className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-medium uppercase tracking-[0.18em] text-white/72 sm:text-[11px]">
            <a href="#systems" className="opacity-80 underline-offset-4 transition-opacity duration-200 hover:opacity-100 hover:underline text-white/80">
              → View Systems
            </a>
            <a href="#logs" className="opacity-80 underline-offset-4 transition-opacity duration-200 hover:opacity-100 hover:underline text-white/80">
              → Read Logs
            </a>
            <a href="#terminal" className="opacity-80 underline-offset-4 transition-opacity duration-200 hover:opacity-100 hover:underline text-white/80">
              → Open Terminal
            </a>
          </nav>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-sm sm:p-6"
        >
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Live Status</p>
              <div className="space-y-2 text-sm text-white/80">
                <p className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  Available for select projects
                </p>
                <p className="text-white/55">GMT+5:30 · Replies within 24h</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Capability Stack</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Frontend Systems",
                  "Motion UI",
                  "Design Engineering",
                  "Performance",
                  "Accessibility",
                ].map((capability) => (
                  <span
                    key={capability}
                    className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.08em] text-white/80"
                  >
                    {capability}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-[10px] uppercase tracking-[0.22em] text-white/45">Snippet</p>
              <div className="rounded-xl border border-white/10 bg-black/70 p-4 font-mono text-[12px] leading-6 text-[#d9ffd9]">
                <p>$ init project --intent premium</p>
                <p>$ compose ui --mode minimal</p>
                <p>$ deploy --target production</p>
                <p className="mt-1 text-white/80">
                  &gt; system status: shipping
                  <span className="ml-1 inline-block h-[1.05em] w-[7px] translate-y-[2px] animate-pulse bg-white" />
                </p>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>
    </motion.section>
  );
}
