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
import { StarField } from "./StarField";

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
      <StarField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(255,255,255,0.04),transparent_40%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(rgba(255,255,255,0.5)_0.5px,transparent_0.5px)] [background-size:3px_3px]" />
      <div className="pointer-events-none absolute left-[28%] top-[42%] h-[58vh] w-[58vh] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.06),transparent_60%)] blur-3xl" />

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-4xl"
        >
          <h1 className="select-none text-[clamp(4.25rem,16vw,13rem)] font-black uppercase leading-[0.85] tracking-[-0.045em] text-white">
            ANRG.
          </h1>

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
      </div>
    </motion.section>
  );
}
