"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { LogEntry } from "./types";
import { uid } from "./utils";

type Draft = {
  coords: [number, number];
  place?: string;
};

type State = {
  hydrated: boolean;
  logs: LogEntry[];
  selectedId: string | null;
  draft: Draft | null;
  addLog: (entry: Omit<LogEntry, "id">) => string;
  removeLog: (id: string) => void;
  select: (id: string | null) => void;
  startDraft: (draft: Draft) => void;
  cancelDraft: () => void;
};

const seed: LogEntry[] = [
  {
    id: "seed-1",
    date: "2026-04-12T18:24:00+09:00",
    title: "성안길 저녁",
    body: "퇴근길에 들른 성안길. 가로등이 켜지는 순간이 좋았다.",
    coords: [127.4892, 36.6376],
    place: "청주 성안길",
  },
  {
    id: "seed-2",
    date: "2026-04-19T10:05:00+09:00",
    title: "상당산성 산책",
    body: "바람이 차가웠지만 햇살은 따뜻했다. 봄이 다 가기 전에 한 번 더 와야지.",
    coords: [127.5141, 36.6491],
    place: "상당산성",
  },
  {
    id: "seed-3",
    date: "2026-04-26T15:40:00+09:00",
    title: "청남대 호숫가",
    body: "벚꽃은 졌지만 잎이 더 예뻤다. 물 위에 비친 하늘.",
    coords: [127.4856, 36.4711],
    place: "청남대",
  },
];

export const useStore = create<State>()(
  persist(
    (set) => ({
      hydrated: false,
      logs: seed,
      selectedId: null,
      draft: null,
      addLog: (entry) => {
        const id = uid();
        set((s) => ({ logs: [...s.logs, { ...entry, id }], draft: null, selectedId: id }));
        return id;
      },
      removeLog: (id) =>
        set((s) => ({
          logs: s.logs.filter((l) => l.id !== id),
          selectedId: s.selectedId === id ? null : s.selectedId,
        })),
      select: (id) => set({ selectedId: id }),
      startDraft: (draft) => set({ draft, selectedId: null }),
      cancelDraft: () => set({ draft: null }),
    }),
    {
      name: "traces.v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ logs: s.logs }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);