"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

export function CustomCursor() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const smoothX = useSpring(x, { stiffness: 420, damping: 36, mass: 0.2 });
  const smoothY = useSpring(y, { stiffness: 420, damping: 36, mass: 0.2 });

  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  const hotspotX = 4;
  const hotspotY = 3;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");

    const sync = () => {
      const shouldEnable = !(mediaQuery.matches || navigator.maxTouchPoints > 0);
      setEnabled(shouldEnable);
      setVisible(shouldEnable);

      if (shouldEnable) {
        document.documentElement.classList.add("custom-cursor-enabled");
      } else {
        document.documentElement.classList.remove("custom-cursor-enabled");
      }
    };

    sync();

    mediaQuery.addEventListener("change", sync);

    const handleMove = (event: MouseEvent) => {
      x.set(event.clientX - hotspotX);
      y.set(event.clientY - hotspotY);
      setVisible(true);
    };

    const handleLeave = () => {
      setVisible(false);
    };
    const handleEnter = () => setVisible(true);
    const handleDown = () => setPressed(true);
    const handleUp = () => setPressed(false);

    window.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseleave", handleLeave);
    document.addEventListener("mouseenter", handleEnter);
    window.addEventListener("mousedown", handleDown);
    window.addEventListener("mouseup", handleUp);

    return () => {
      mediaQuery.removeEventListener("change", sync);
      window.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseleave", handleLeave);
      document.removeEventListener("mouseenter", handleEnter);
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("mouseup", handleUp);
      document.documentElement.classList.remove("custom-cursor-enabled");
    };
  }, [hotspotX, hotspotY, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="custom-cursor"
      style={{ x: smoothX, y: smoothY }}
      animate={{ opacity: visible ? 1 : 0, scale: pressed ? 0.92 : 1 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
    >
      <span aria-hidden className="custom-cursor-icon" />
    </motion.div>
  );
}
