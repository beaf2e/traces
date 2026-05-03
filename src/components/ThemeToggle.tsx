"use client";

import { motion } from "framer-motion";
import { THEMES, THEME_ORDER } from "@/lib/themes";
import { useThemeStore } from "@/lib/theme-store";

/**
 * Three colored dots in a row. Tap to change the map theme.
 * The active dot scales up and gets a thin ring.
 */
export default function ThemeToggle() {
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div className="flex items-center gap-2.5">
      {THEME_ORDER.map((id) => {
        const t = THEMES[id];
        const active = id === themeId;
        return (
          <button
            key={id}
            onClick={() => setTheme(id)}
            aria-label={`테마: ${t.label}`}
            title={t.label}
            className="relative grid place-items-center w-6 h-6 rounded-full"
          >
            <span
              className="block w-3 h-3 rounded-full"
              style={{
                background: t.swatch,
                boxShadow: active
                  ? `0 0 0 1.5px rgba(0,0,0,0.7), 0 0 0 3px ${t.swatch}, 0 0 12px 2px ${t.swatch}55`
                  : "0 0 0 1px rgba(255,255,255,0.18)",
              }}
            />
            {active && (
              <motion.span
                layoutId="theme-active"
                className="absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 360, damping: 32 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
