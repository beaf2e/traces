"use client";

import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth";

const FALLBACK_COORDS: [number, number] = [127.4892, 36.6376];

/**
 * Floating action button: one tap → request GPS → open new-log sheet.
 * Lives bottom-right, primary affordance for mobile capture flow.
 */
export default function Fab({ onLoginRequest }: { onLoginRequest: () => void }) {
  const { user } = useSession();
  const startDraft = useStore((s) => s.startDraft);
  const draft = useStore((s) => s.draft);
  const [busy, setBusy] = useState(false);

  // Hide while a draft is already open to avoid stacking on the sheet
  if (draft) return null;

  function handle() {
    if (!user) {
      onLoginRequest();
      return;
    }
    if (!navigator.geolocation) {
      startDraft({ coords: FALLBACK_COORDS });
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        startDraft({ coords: [pos.coords.longitude, pos.coords.latitude] });
      },
      () => {
        setBusy(false);
        startDraft({ coords: FALLBACK_COORDS });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 },
    );
  }

  return (
    <motion.button
      onClick={handle}
      aria-label="새 기록 추가"
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 24, delay: 0.2 }}
      whileTap={{ scale: 0.92 }}
      className="pointer-events-auto absolute z-30 bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-5 grid place-items-center w-14 h-14 rounded-full bg-white text-black hairline shadow-[0_18px_40px_-12px_rgba(255,255,255,0.32),0_8px_20px_-8px_rgba(0,0,0,0.6)]"
    >
      {busy ? (
        <Loader2 size={20} className="animate-spin" />
      ) : (
        <Plus size={22} strokeWidth={2.2} />
      )}
    </motion.button>
  );
}
