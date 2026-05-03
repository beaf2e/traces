"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { THEMES, type Theme, type ThemeId } from "./themes";

type State = {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
};

export const useThemeStore = create<State>()(
  persist(
    (set) => ({
      themeId: "dark",
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: "traces.theme",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useCurrentTheme(): Theme {
  const id = useThemeStore((s) => s.themeId);
  return THEMES[id];
}
