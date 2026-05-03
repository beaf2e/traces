"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Hand, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore, DEMO_LOG_IDS } from "@/lib/store";
import { useSession } from "@/lib/auth";

const KEY = "traces.hint.dismissed";

/**
 * Slim chip at top-center for first-time visitors. Tells them how to start
 * using the app. Auto-hides once a draft is opened or a real log exists,
 * and remembers dismissal across sessions.
 */
export default function OnboardingHint() {
  const { user, loading } = useSession();
  const draft = useStore((s) => s.draft);
  const selectedId = useStore((s) => s.selectedId);
  const logs = useStore((s) => s.logs);

  const [dismissed, setDismissed] = useState<boolean | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  function dismiss(e?: React.MouseEvent) {
    e?.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
  }

  // Hide while a sheet is open (would compete for attention)
  if (draft || selectedId) return null;
  // Don't show until we've checked storage
  if (dismissed !== false || loading) return null;

  const hasOwnLogs = logs.some((l) => !DEMO_LOG_IDS.has(l.id));
  // Once the user has their first real log, the hint has done its job.
  if (user && hasOwnLogs) return null;

  const message = user
    ? "지도를 탭하거나 + 버튼으로 첫 기록을 남겨보세요"
    : "지도를 한번 둘러보고, 로그인하면 나만의 지도를 시작해요";

  return (
    <AnimatePresence>
      <motion.div
        key="hint"
        layout
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -8, opacity: 0 }}
        transition={{
          // Mount/unmount tween
          y: { type: "spring", stiffness: 320, damping: 28, delay: 0.6 },
          opacity: { duration: 0.25, delay: 0.6 },
          // Size morph between collapsed/expanded — single source of truth
          layout: { type: "spring", stiffness: 380, damping: 34 },
        }}
        onClick={() => setExpanded((v) => !v)}
        className={`glass pointer-events-auto absolute z-30 left-1/2 -translate-x-1/2 cursor-pointer overflow-hidden ${
          expanded ? "rounded-2xl" : "rounded-full"
        }`}
        style={{
          top: "calc(env(safe-area-inset-top) + 1rem)",
          // Keep the original chip width in both states — only height changes.
          maxWidth: "min(calc(100vw - 7.5rem), 480px)",
          // Smooth border-radius transition to match the size morph
          transition: "border-radius 0.28s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
        role="button"
        aria-expanded={expanded}
      >
        <div
          className={`flex gap-2.5 pl-3.5 pr-1.5 ${
            expanded ? "items-start py-2.5" : "items-center py-1.5"
          }`}
        >
          <Hand
            size={13}
            className={`opacity-70 shrink-0 ${expanded ? "mt-1" : ""}`}
          />
          <span
            className={`text-[12.5px] text-[var(--fg)]/95 leading-relaxed flex-1 min-w-0 ${
              expanded ? "whitespace-normal" : "truncate"
            }`}
          >
            {message}
          </span>
          <button
            onClick={dismiss}
            aria-label="안내 닫기"
            className={`btn-ghost p-1 rounded-full shrink-0 ${
              expanded ? "mt-0.5" : ""
            }`}
          >
            <X size={13} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
