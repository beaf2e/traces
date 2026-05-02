"use client";

import { create } from "zustand";
import type { LogEntry } from "./types";
import { rowToEntry } from "./types";
import { PHOTO_BUCKET, supabase } from "./supabase";
import { dataURLToBlob } from "./utils";

type Draft = {
  coords: [number, number];
  place?: string;
};

type State = {
  userId: string | null;
  loading: boolean;
  logs: LogEntry[];
  selectedId: string | null;
  draft: Draft | null;

  setUser: (userId: string | null) => void;
  refresh: () => Promise<void>;

  /** Returns the new log id, or null on failure. `photoDataUrl` is a base64 JPEG. */
  addLog: (
    input: {
      title: string;
      body: string;
      place?: string;
      coords: [number, number];
      date: string;
      photoDataUrl?: string;
    },
  ) => Promise<string | null>;

  removeLog: (id: string) => Promise<void>;
  select: (id: string | null) => void;
  startDraft: (draft: Draft) => void;
  cancelDraft: () => void;
};

const DEMO_LOGS: LogEntry[] = [
  {
    id: "demo-1",
    date: "2026-04-12T18:24:00+09:00",
    title: "성안길 저녁",
    body: "퇴근길에 들른 성안길. 가로등이 켜지는 순간이 좋았다.",
    coords: [127.4892, 36.6376],
    place: "청주 성안길",
  },
  {
    id: "demo-2",
    date: "2026-04-19T10:05:00+09:00",
    title: "상당산성 산책",
    body: "바람이 차가웠지만 햇살은 따뜻했다. 봄이 다 가기 전에 한 번 더 와야지.",
    coords: [127.5141, 36.6491],
    place: "상당산성",
  },
  {
    id: "demo-3",
    date: "2026-04-26T15:40:00+09:00",
    title: "청남대 호숫가",
    body: "벚꽃은 졌지만 잎이 더 예뻤다. 물 위에 비친 하늘.",
    coords: [127.4856, 36.4711],
    place: "청남대",
  },
];

export const DEMO_LOG_IDS = new Set(DEMO_LOGS.map((l) => l.id));

export const useStore = create<State>()((set, get) => ({
  userId: null,
  loading: false,
  logs: DEMO_LOGS,
  selectedId: null,
  draft: null,

  setUser: (userId) => {
    const prev = get().userId;
    set({ userId });
    if (userId && userId !== prev) {
      void get().refresh();
    } else if (!userId) {
      set({ logs: DEMO_LOGS, selectedId: null, draft: null });
    }
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) {
      set({ logs: DEMO_LOGS });
      return;
    }
    set({ loading: true });
    const { data, error } = await supabase()
      .from("logs")
      .select("*")
      .order("date", { ascending: true });
    if (error) {
      console.error("refresh failed", error);
      set({ loading: false });
      return;
    }
    set({
      logs: (data ?? []).map(rowToEntry),
      loading: false,
    });
  },

  addLog: async ({ title, body, place, coords, date, photoDataUrl }) => {
    const { userId } = get();
    if (!userId) return null;

    const sb = supabase();
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    let photo_path: string | null = null;

    if (photoDataUrl) {
      const blob = dataURLToBlob(photoDataUrl);
      const path = `${userId}/${id}.jpg`;
      const { error: upErr } = await sb.storage
        .from(PHOTO_BUCKET)
        .upload(path, blob, {
          contentType: "image/jpeg",
          cacheControl: "31536000",
          upsert: false,
        });
      if (upErr) {
        console.error("photo upload failed", upErr);
      } else {
        photo_path = path;
      }
    }

    const { data, error } = await sb
      .from("logs")
      .insert({
        id,
        user_id: userId,
        date,
        title,
        body,
        place: place ?? null,
        lng: coords[0],
        lat: coords[1],
        photo_path,
      })
      .select("*")
      .single();

    if (error || !data) {
      console.error("insert failed", error);
      return null;
    }

    set((s) => ({
      logs: [...s.logs, rowToEntry(data)].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      ),
      draft: null,
      selectedId: data.id,
    }));
    return data.id;
  },

  removeLog: async (id) => {
    const sb = supabase();
    const target = get().logs.find((l) => l.id === id);
    // Optimistic
    set((s) => ({
      logs: s.logs.filter((l) => l.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }));
    if (target?.photoPath) {
      await sb.storage.from(PHOTO_BUCKET).remove([target.photoPath]);
    }
    const { error } = await sb.from("logs").delete().eq("id", id);
    if (error) {
      console.error("delete failed", error);
      // Revert
      void get().refresh();
    }
  },

  select: (id) => set({ selectedId: id }),
  startDraft: (draft) => set({ draft, selectedId: null }),
  cancelDraft: () => set({ draft: null }),
}));