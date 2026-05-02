"use client";

import { animate, motion, useMotionValue, type PanInfo } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/utils";
import type { LogEntry } from "@/lib/types";

const REVEAL_PX = 88;
const SNAP = { type: "spring" as const, stiffness: 380, damping: 32 };

export default function SwipeableLogRow({
  log,
  active,
  isDemo,
  indexLabel,
  onSelect,
  onDelete,
}: {
  log: LogEntry;
  active: boolean;
  isDemo: boolean;
  indexLabel: string;
  onSelect: () => void;
  onDelete: () => Promise<void> | void;
}) {
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function open() {
    animate(x, -REVEAL_PX, SNAP);
    setRevealed(true);
  }
  function close() {
    animate(x, 0, SNAP);
    setRevealed(false);
  }

  function onDragEnd(_: unknown, info: PanInfo) {
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    if (offset < -REVEAL_PX / 2 || velocity < -350) open();
    else close();
  }

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
      // No need to close — row will unmount when log is removed
    } catch {
      setDeleting(false);
      close();
    }
  }

  function handleTap() {
    if (revealed) {
      close();
      return;
    }
    onSelect();
  }

  return (
    <li className="rounded-2xl overflow-hidden">
      <motion.div
        drag={isDemo ? false : "x"}
        dragConstraints={{ left: -REVEAL_PX, right: 0 }}
        dragElastic={{ left: 0.06, right: 0 }}
        dragMomentum={false}
        onDragEnd={onDragEnd}
        onTap={handleTap}
        style={{ x }}
        className="relative cursor-pointer touch-pan-y"
      >
        <div
          className={`px-3 py-2.5 rounded-2xl transition-colors select-none ${
            active ? "bg-white/8" : "hover:bg-white/[0.04]"
          }`}
        >
          <div className="flex items-baseline justify-between gap-2">
            <span
              className={`text-[14px] font-medium tracking-tight truncate ${
                active ? "text-white" : "text-[var(--fg)]/90"
              }`}
            >
              {log.title}
            </span>
            <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--fg-faint)]">
              {indexLabel}
            </span>
          </div>
          <div className="mt-0.5 text-[11.5px] text-[var(--fg-faint)]">
            {formatDate(log.date)}
            {log.place ? ` · ${log.place}` : ""}
          </div>
        </div>

        {!isDemo && (
          <button
            onClick={handleDelete}
            aria-label="삭제"
            className="absolute left-full top-0 bottom-0 w-[88px] grid place-items-center bg-rose-500/85 hover:bg-rose-500 active:bg-rose-600 text-white transition-colors"
          >
            {deleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        )}
      </motion.div>
    </li>
  );
}
