"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BOOT_LINES = [
  "$ whoami",
  "anrg — systems, ai, engineering.",
  "$ status",
  "online. ask me anything.",
];

export function TerminalSection() {
  const [booted, setBooted] = useState(false);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamBuffer, setStreamBuffer] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Boot animation ─────────────────────────────────────────────────────────
  useEffect(() => {
    let lineIdx = 0;
    let charIdx = 0;
    let current: string[] = [];

    const tick = () => {
      if (lineIdx >= BOOT_LINES.length) {
        setBooted(true);
        setTimeout(() => inputRef.current?.focus(), 100);
        return;
      }
      const line = BOOT_LINES[lineIdx];
      charIdx++;
      current = [...current];
      current[lineIdx] = line.slice(0, charIdx);
      setBootLines([...current]);

      if (charIdx >= line.length) {
        lineIdx++;
        charIdx = 0;
        setTimeout(tick, lineIdx % 2 === 0 ? 220 : 120);
      } else {
        setTimeout(tick, lineIdx % 2 === 0 ? 28 : 14);
      }
    };
    const t = setTimeout(tick, 400);
    return () => clearTimeout(t);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [bootLines, messages, streamBuffer]);

  // ── Send message ───────────────────────────────────────────────────────────
  const send = async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const history = [...messages, userMsg];
    setMessages(history);
    setInput("");
    setIsStreaming(true);
    setStreamBuffer("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) throw new Error("Backend error");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        full += chunk;
        setStreamBuffer(full);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: full }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "— backend offline. start the python server." },
      ]);
    } finally {
      setIsStreaming(false);
      setStreamBuffer("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") send();
  };

  return (
    <section id="terminal" className="border-t border-white/[0.06] px-6 pb-24 pt-8 sm:px-10 lg:px-20 lg:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mx-auto max-w-6xl rounded-2xl border border-white/10 bg-[#050505]"
        onClick={() => booted && inputRef.current?.focus()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-xs text-white/80 sm:px-6">
          <span>anurag@portfolio ~ %</span>
          <div className="flex items-center gap-2">
            {isStreaming && (
              <span className="text-[10px] text-white/40 tracking-widest animate-pulse">
                thinking…
              </span>
            )}
            <span className="h-2 w-2 rounded-full bg-white/50" />
          </div>
        </div>

        {/* Body */}
        <div
          ref={bodyRef}
          className="h-80 overflow-y-auto px-5 py-5 font-mono text-sm leading-7 sm:px-6"
        >
          {/* Boot lines */}
          {bootLines.map((line, i) => (
            <p
              key={i}
              className={
                line.startsWith("$")
                  ? "text-white/60"
                  : "text-[#d7ffd7]"
              }
            >
              {line}
            </p>
          ))}

          {/* Chat history */}
          {messages.map((m, i) => (
            <p
              key={i}
              className={
                m.role === "user"
                  ? "mt-2 text-white/70"
                  : "text-[#d7ffd7] whitespace-pre-wrap"
              }
            >
              {m.role === "user" ? `> ${m.content}` : m.content}
            </p>
          ))}

          {/* Live stream buffer */}
          {isStreaming && streamBuffer && (
            <p className="text-[#d7ffd7] whitespace-pre-wrap">{streamBuffer}</p>
          )}

          {/* Input line */}
          {booted && (
            <div className="mt-3 flex items-center gap-2 text-white">
              <span className="text-white/50 select-none">&gt;</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                disabled={isStreaming}
                placeholder={isStreaming ? "" : "ask me anything…"}
                className="flex-1 bg-transparent outline-none placeholder:text-white/25 caret-white disabled:opacity-30"
                spellCheck={false}
                autoComplete="off"
              />
              {!isStreaming && (
                <span className="h-[1.05em] w-[7px] translate-y-[2px] animate-pulse bg-white inline-block" />
              )}
            </div>
          )}
        </div>
      </motion.div>
    </section>
  );
}
