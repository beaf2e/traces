"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStore, DEMO_LOG_IDS } from "@/lib/store";
import { formatDate, formatTime } from "@/lib/utils";
import { publicPhotoUrl } from "@/lib/supabase";

export default function MemoryCard() {
  const log = useStore((s) =>
    s.selectedId ? s.logs.find((l) => l.id === s.selectedId) ?? null : null,
  );
  const close = useStore((s) => s.select);
  const remove = useStore((s) => s.removeLog);
  const [deleting, setDeleting] = useState(false);

  const isDemo = log ? DEMO_LOG_IDS.has(log.id) : false;
  const photoUrl = log?.photoPath ? publicPhotoUrl(log.photoPath) : null;

  async function onDelete(id: string) {
    setDeleting(true);
    try {
      await remove(id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AnimatePresence>
      {log && (
        <motion.aside
          key={log.id}
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          className="glass pointer-events-auto absolute z-20 right-5 top-5 w-[360px] max-w-[calc(100vw-2.5rem)] rounded-3xl overflow-hidden"
        >
          {photoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoUrl}
              alt=""
              className="w-full h-48 object-cover"
            />
          )}
          <div className="px-5 pt-5 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.16em] text-[var(--fg-faint)]">
                  {formatDate(log.date)} · {formatTime(log.date)}
                  {isDemo && " · 데모"}
                </div>
                <h2 className="mt-1.5 text-[19px] font-semibold tracking-tight">
                  {log.title}
                </h2>
              </div>
              <button
                onClick={() => close(null)}
                aria-label="닫기"
                className="btn-ghost -mr-2 -mt-1 p-1.5 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            {log.place && (
              <div className="mt-3 flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]">
                <MapPin size={13} className="opacity-70" />
                {log.place}
              </div>
            )}

            <p className="mt-4 text-[14.5px] leading-[1.65] text-[var(--fg)]/85 whitespace-pre-wrap">
              {log.body}
            </p>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] text-[var(--fg-faint)] tabular-nums">
                {log.coords[1].toFixed(4)}, {log.coords[0].toFixed(4)}
              </span>
              {!isDemo && (
                <button
                  onClick={() => onDelete(log.id)}
                  disabled={deleting}
                  className="btn-ghost flex items-center gap-1.5 text-[12.5px]"
                >
                  {deleting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  삭제
                </button>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}