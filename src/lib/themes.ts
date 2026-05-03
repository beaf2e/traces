export type ThemeId = "dark" | "midnight" | "sepia";

export type Theme = {
  id: ThemeId;
  label: string;
  /** Swatch dot color shown in the theme toggle */
  swatch: string;
  /** CSS filter applied to the MapLibre canvas only (markers stay untouched) */
  mapCanvasFilter: string;
  /** Path/node accent — applied to layer paint and CSS vars */
  accent: string;
  node: string;
  nodeGlow: string;
  pathLine: string;
  pathGlow: string;
  /** Optional warm/cool wash above the map for mood (very subtle) */
  mapWash: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  dark: {
    id: "dark",
    label: "다크",
    swatch: "#ffffff",
    mapCanvasFilter: "none",
    accent: "#ffffff",
    node: "#ffffff",
    nodeGlow: "rgba(255,255,255,0.55)",
    pathLine: "rgba(255,255,255,0.72)",
    pathGlow: "rgba(255,255,255,0.18)",
    mapWash: "transparent",
  },
  midnight: {
    id: "midnight",
    label: "미드나잇",
    swatch: "#8aa9ff",
    // Cool blue night feel — shift hue, soften saturation, dim slightly
    mapCanvasFilter: "hue-rotate(205deg) saturate(0.55) brightness(0.92)",
    accent: "#dfe8ff",
    node: "#e2ecff",
    nodeGlow: "rgba(138,169,255,0.6)",
    pathLine: "rgba(218,229,255,0.78)",
    pathGlow: "rgba(138,169,255,0.22)",
    mapWash: "rgba(20, 36, 80, 0.18)",
  },
  sepia: {
    id: "sepia",
    label: "세피아",
    swatch: "#e8c08a",
    // Warm vintage tone — sepia tint with reduced saturation
    mapCanvasFilter: "sepia(0.45) hue-rotate(-12deg) saturate(0.85) brightness(0.95)",
    accent: "#f3d8a8",
    node: "#f4d9a6",
    nodeGlow: "rgba(232,192,138,0.62)",
    pathLine: "rgba(243,214,168,0.82)",
    pathGlow: "rgba(232,192,138,0.24)",
    mapWash: "rgba(70, 40, 12, 0.14)",
  },
};

export const THEME_ORDER: ThemeId[] = ["dark", "midnight", "sepia"];
