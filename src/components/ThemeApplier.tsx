"use client";

import { useEffect } from "react";
import { useCurrentTheme } from "@/lib/theme-store";

/**
 * Reflects the active theme onto:
 *  - CSS custom properties (so .node-dot, hover states, etc. follow)
 *  - a `data-theme` attribute on <html> (so canvas filter selectors apply)
 */
export default function ThemeApplier() {
  const theme = useCurrentTheme();

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme.id;
    root.style.setProperty("--node", theme.node);
    root.style.setProperty("--node-glow", theme.nodeGlow);
    root.style.setProperty("--path", theme.pathLine);
    root.style.setProperty("--accent", theme.accent);
  }, [theme]);

  return null;
}
