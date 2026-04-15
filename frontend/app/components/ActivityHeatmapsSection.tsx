"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ActivityCalendar } from "react-activity-calendar";
import type { Activity } from "react-activity-calendar";

type ProviderKey = "github" | "leetcode" | "monkeytype";

interface ActivityPoint {
  date: string;
  count: number;
  level: number;
}

interface ProviderPayload {
  source: ProviderKey;
  label: string;
  username: string;
  available: boolean;
  data: ActivityPoint[];
  totalCount: number;
  maxCount: number;
  error?: string;
  note?: string;
}

interface ActivityResponse {
  updatedAt: string;
  cacheTtlSeconds: number;
  cached: boolean;
  providers: Record<ProviderKey, ProviderPayload>;
}

const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ??
  (process.env.NODE_ENV === "development" ? "http://127.0.0.1:5000" : "")
).replace(/\/+$/, "");

const TAB_ORDER: ProviderKey[] = ["github", "leetcode", "monkeytype"];

const TAB_ACCENTS: Record<ProviderKey, string> = {
  github: "bg-[#a6ff4d]",
  leetcode: "bg-[#ffd357]",
  monkeytype: "bg-[#7af4ff]",
};

const TAB_GLOWS: Record<ProviderKey, string> = {
  github: "shadow-[0_0_22px_rgba(166,255,77,0.22)]",
  leetcode: "shadow-[0_0_22px_rgba(255,211,87,0.22)]",
  monkeytype: "shadow-[0_0_22px_rgba(122,244,255,0.22)]",
};

const TAB_ICONS: Record<ProviderKey, string> = {
  github: "GH",
  leetcode: "LC",
  monkeytype: "MT",
};

const TAB_ICON_TINT: Record<ProviderKey, string> = {
  github: "text-[#a6ff4d]",
  leetcode: "text-[#ffd357]",
  monkeytype: "text-[#7af4ff]",
};

const CALENDAR_THEMES: Record<ProviderKey, { light: string[]; dark: string[] }> = {
  github: {
    light: ["#0a0a0a", "#203b1f", "#2f6a2d", "#4ca24a", "#a6ff4d"],
    dark: ["#0a0a0a", "#203b1f", "#2f6a2d", "#4ca24a", "#a6ff4d"],
  },
  leetcode: {
    light: ["#0a0a0a", "#403319", "#6e521b", "#b8831f", "#ffd357"],
    dark: ["#0a0a0a", "#403319", "#6e521b", "#b8831f", "#ffd357"],
  },
  monkeytype: {
    light: ["#0a0a0a", "#1d3840", "#1e5860", "#2e8590", "#7af4ff"],
    dark: ["#0a0a0a", "#1d3840", "#1e5860", "#2e8590", "#7af4ff"],
  },
};

function formatUpdatedAt(value: string | undefined): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleString();
}

export function ActivityHeatmapsSection() {
  const [activeTab, setActiveTab] = useState<ProviderKey>("github");
  const [payload, setPayload] = useState<ActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/activity`, {
          method: "GET",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch activity data");
        }

        const data: ActivityResponse = await response.json();
        setPayload(data);

        const firstAvailable = TAB_ORDER.find((tab) => data.providers?.[tab]?.available) ?? "github";
        setActiveTab((prev) => (data.providers?.[prev] ? prev : firstAvailable));
      } catch (err) {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Unable to load activity heatmaps");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    load();
    return () => controller.abort();
  }, []);

  const current = useMemo(() => payload?.providers?.[activeTab], [payload, activeTab]);

  return (
    <section
      id="activity"
      className="border-t border-white/[0.06] px-6 py-20 sm:px-10 lg:px-20 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[11px] uppercase tracking-[0.3em] text-white/55">
            Activity Heatmaps
          </h2>
          {payload && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40">
              {payload.cached ? "cached" : "live"} | updated {formatUpdatedAt(payload.updatedAt)}
            </p>
          )}
        </div>

        <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#050505]">
          <div className="border-b border-white/10 px-4 py-3 font-mono text-xs text-white/70 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-white/45">&gt;</span>
              {TAB_ORDER.map((tab) => {
                const provider = payload?.providers?.[tab];
                const isActive = tab === activeTab;
                const isAvailable = provider?.available;

                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`relative overflow-hidden rounded-md border px-3 py-1 uppercase tracking-[0.12em] transition ${
                      isActive
                        ? `border-transparent text-black ${TAB_GLOWS[tab]}`
                        : "border-white/18 bg-transparent text-white/70 hover:text-white"
                    } ${!isAvailable ? "opacity-60" : "opacity-100"}`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activity-tab-highlight"
                        transition={{ type: "spring", stiffness: 380, damping: 34, mass: 0.7 }}
                        className={`absolute inset-0 ${TAB_ACCENTS[tab]}`}
                      />
                    )}

                    <span className="relative z-10 inline-flex items-center gap-2">
                      <span
                        className={`inline-flex h-4 w-4 items-center justify-center rounded-[4px] border text-[8px] font-semibold leading-none ${
                          isActive
                            ? "border-black/25 bg-black/10 text-black"
                            : `border-white/25 bg-white/[0.03] ${TAB_ICON_TINT[tab]}`
                        }`}
                      >
                        {TAB_ICONS[tab]}
                      </span>
                      <span>{provider?.label ?? tab}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="px-4 py-5 sm:px-6 sm:py-6">
            {isLoading && (
              <div className="space-y-4">
                <div className="h-5 w-48 animate-pulse rounded bg-white/10" />
                <div className="h-36 animate-pulse rounded-xl border border-white/10 bg-white/[0.02]" />
              </div>
            )}

            {!isLoading && error && (
              <p className="font-mono text-xs text-red-300">{error}</p>
            )}

            {!isLoading && !error && current && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10, scale: 0.985, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -8, scale: 0.992, filter: "blur(4px)" }}
                  transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="space-y-4"
                >
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-[0.14em] text-white/55">
                    <span>
                      Source: <span className="text-white/80">{current.label}</span>
                    </span>
                    <span>
                      Total: <span className="text-white/80">{current.totalCount}</span>
                    </span>
                    <span>
                      Peak/Day: <span className="text-white/80">{current.maxCount}</span>
                    </span>
                    {current.username && (
                      <span>
                        User: <span className="text-white/80">{current.username}</span>
                      </span>
                    )}
                  </div>

                  {current.available ? (
                    <div className="space-y-3 overflow-x-auto rounded-xl border border-white/10 bg-black/30 p-3 sm:p-4">
                      <div className="min-w-[720px]">
                        <ActivityCalendar
                          data={current.data as Activity[]}
                          colorScheme="dark"
                          theme={CALENDAR_THEMES[activeTab]}
                          blockSize={12}
                          blockMargin={4}
                          fontSize={12}
                          showWeekdayLabels
                          labels={{
                            totalCount: "{{count}} activities in the last year",
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">
                        <span>less</span>
                        <div className="flex items-center gap-1.5">
                          {CALENDAR_THEMES[activeTab].dark.map((color, idx) => (
                            <motion.span
                              key={`${activeTab}-legend-${idx}`}
                              whileHover={{ y: -2, scale: 1.08 }}
                              transition={{ type: "spring", stiffness: 500, damping: 24 }}
                              className="inline-block h-3 w-3 rounded-[4px] border border-white/10"
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <span>more</span>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                      <p className="text-sm text-white/75">
                        {current.error || "No activity data available for this source yet."}
                      </p>
                    </div>
                  )}

                  {current.note && (
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-white/40">
                      {current.note}
                    </p>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
