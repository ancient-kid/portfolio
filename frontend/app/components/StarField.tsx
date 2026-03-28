"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  glowSize: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

function samplePosition(width: number, height: number): { x: number; y: number } {
  // 60% chance: cluster around ANRG text zone (upper-left region)
  if (Math.random() < 0.90) {
    const cx = width * 0.28;
    const cy = height * 0.40;
    const spreadX = width * 0.30;
    const spreadY = height * 0.28;

    const u = 1 - Math.random();
    const v = Math.random();
    const z1 = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    const z2 = Math.sqrt(-2 * Math.log(u)) * Math.sin(2 * Math.PI * v);

    return {
      x: Math.min(Math.max(cx + z1 * spreadX, 0), width),
      y: Math.min(Math.max(cy + z2 * spreadY, 0), height),
    };
  }

  // 40%: scattered across the rest of the canvas
  return { x: Math.random() * width, y: Math.random() * height };
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animFrameId: number;
    let stars: Star[] = [];

    const STAR_COUNT = 1000;

    function buildStars(w: number, h: number) {
      stars = Array.from({ length: STAR_COUNT }, () => {
        const { x, y } = samplePosition(w, h);
        // pixel-scale: 0.15 – 0.65 px
        const radius = Math.random() * 0.2 + 0.15;
        return {
          x,
          y,
          radius,
          opacity: Math.random() * 0.55 + 0.30,
          glowSize: radius * (Math.random() * 3 + 2), // tight glow: 2–5× radius
          twinkleSpeed: Math.random() * 0.5 + 0.2,
          twinkleOffset: Math.random() * Math.PI * 2,
        };
      });
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      buildStars(canvas!.width, canvas!.height);
    }

    resize();
    window.addEventListener("resize", resize);

    let t = 0;
    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        const twinkle = Math.sin(t * star.twinkleSpeed + star.twinkleOffset);
        const alpha = Math.max(0.08, star.opacity + twinkle * 0.15);

        // Soft glow halo
        const glow = ctx.createRadialGradient(
          star.x, star.y, 0,
          star.x, star.y, star.glowSize
        );
        glow.addColorStop(0, `rgba(210,225,255,${alpha * 0.5})`);
        glow.addColorStop(1, "rgba(210,225,255,0)");
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.glowSize, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Sharp pixel-like core
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(240,245,255,${Math.min(1, alpha * 1.8)})`;
        ctx.fill();
      }

      t += 0.010;
      animFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-0"
      aria-hidden="true"
    />
  );
}

