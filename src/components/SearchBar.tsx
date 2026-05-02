"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { geocode, type GeocodeResult } from "@/lib/geocode";
import { useStore } from "@/lib/store";

export default function SearchBar() {
  const startDraft = useStore((s) => s.startDraft);

  const [q, setQ] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      try {
        const list = await geocode(q, ac.signal);
        setResults(list);
      } catch (err) {
        if ((err as Error).name !== "AbortError") setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [q]);

  function pick(r: GeocodeResult) {
    startDraft({ coords: r.coords, place: r.display_name.split(",")[0] });
    setQ("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="px-4 pb-3">
      <div className="hairline rounded-2xl bg-white/[0.04] flex items-center gap-2 px-3 py-2">
        <Search size={14} className="opacity-60 shrink-0" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="주소·장소 검색"
          className="input-bare text-[13px] py-0.5"
        />
        {loading ? (
          <Loader2 size={13} className="opacity-60 animate-spin shrink-0" />
        ) : q ? (
          <button
            onClick={() => {
              setQ("");
              setResults([]);
            }}
            aria-label="지우기"
            className="opacity-50 hover:opacity-100 shrink-0"
          >
            <X size={13} />
          </button>
        ) : null}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="mt-2 rounded-2xl bg-white/[0.04] hairline overflow-hidden"
          >
            {results.map((r, i) => (
              <li key={i}>
                <button
                  onClick={() => pick(r)}
                  className="w-full text-left px-3 py-2 text-[12.5px] leading-snug hover:bg-white/[0.06] transition-colors"
                >
                  <span className="block text-[var(--fg)]/95 truncate">
                    {r.display_name.split(",")[0]}
                  </span>
                  <span className="block text-[11px] text-[var(--fg-faint)] truncate">
                    {r.display_name.split(",").slice(1).join(",").trim()}
                  </span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}