"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Share, Plus, X } from "lucide-react";
import { useEffect, useState } from "react";

const DISMISS_KEY = "traces.installHint.dismissed";

declare global {
  interface Navigator {
    standalone?: boolean;
  }
}

/**
 * Two jobs:
 *  1) register the service worker on mount
 *  2) on iOS Safari (when not already installed), nudge the user to
 *     "공유 → 홈 화면에 추가" with a small floating card.
 *     Dismissable, remembers the dismissal in localStorage.
 */
export default function PwaInstaller() {
  const [showHint, setShowHint] = useState(false);

  // Register service worker
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof navigator === "undefined" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }
    // Defer registration so it doesn't compete with first paint
    const t = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }, 1500);
    return () => window.clearTimeout(t);
  }, []);

  // Decide whether to show the iOS install hint
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    if (!isIOS) return;
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    // Wait a few seconds so the hint isn't the first thing they see
    const t = window.setTimeout(() => setShowHint(true), 4000);
    return () => window.clearTimeout(t);
  }, []);

  function dismiss() {
    setShowHint(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore quota / privacy mode
    }
  }

  return (
    <AnimatePresence>
      {showHint && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="glass pointer-events-auto fixed z-50 rounded-3xl
            left-3 right-3 max-w-[420px] mx-auto
            bottom-[calc(env(safe-area-inset-bottom)+1rem)]
            px-4 py-3.5"
        >
          <div className="flex items-start gap-3">
            <div className="grid place-items-center w-9 h-9 rounded-2xl bg-white text-black shrink-0">
              <Plus size={16} strokeWidth={2.4} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13.5px] font-semibold tracking-tight">
                홈 화면에 추가하면 앱처럼 써요
              </div>
              <div className="mt-1 text-[12px] leading-snug text-[var(--fg-muted)]">
                Safari 하단의{" "}
                <Share
                  size={12}
                  className="inline -translate-y-[1px] mx-0.5 opacity-90"
                />{" "}
                공유 버튼 → <strong className="font-semibold">홈 화면에 추가</strong>
              </div>
            </div>
            <button
              onClick={dismiss}
              aria-label="닫기"
              className="btn-ghost p-1.5 rounded-full -mr-1 -mt-1 shrink-0"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
