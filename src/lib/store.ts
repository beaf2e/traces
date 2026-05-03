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
  updateDraft: (partial: Partial<Draft>) => void;
  cancelDraft: () => void;
};

const DEMO_LOGS: LogEntry[] = [
  // ── 서울 ──
  {
    id: "demo-seoul-1",
    date: "2026-01-04T07:42:00+09:00",
    title: "새해 광화문",
    body: "차가운 새벽 공기, 첫 다짐. 사람도 적고 마음도 비웠다.",
    coords: [126.9769, 37.5759],
    place: "광화문",
  },
  {
    id: "demo-seoul-2",
    date: "2026-01-12T19:48:00+09:00",
    title: "남산 야경",
    body: "케이블카 대신 걸어 올라간 길. 발끝마다 도시가 펼쳐졌다.",
    coords: [126.9882, 37.5512],
    place: "남산서울타워",
    photoUrl: "/demo-photos/namsan.svg",
  },
  {
    id: "demo-seoul-3",
    date: "2026-01-23T21:15:00+09:00",
    title: "한강 라이드",
    body: "반포대교 분수쇼 끝나갈 무렵. 강물이 가장 조용한 시간.",
    coords: [126.9956, 37.5132],
    place: "반포한강공원",
    photoUrl: "/demo-photos/hangang.svg",
  },

  // ── 대전 ──
  {
    id: "demo-daejeon-1",
    date: "2026-02-08T15:10:00+09:00",
    title: "한밭수목원",
    body: "도심 한가운데에 이런 숲이 있다는 게 사치 같다.",
    coords: [127.3845, 36.3678],
    place: "한밭수목원",
  },
  {
    id: "demo-daejeon-2",
    date: "2026-02-15T06:55:00+09:00",
    title: "유성 새벽 안개",
    body: "온천 김이 거리까지 올라오는 새벽. 사람보다 풍경이 먼저 일어나 있다.",
    coords: [127.3603, 36.3725],
    place: "유성온천",
  },
  {
    id: "demo-daejeon-3",
    date: "2026-02-21T13:30:00+09:00",
    title: "성심당 줄",
    body: "기다리는 시간도 향이 좋았다. 손에 쥔 빵이 따뜻했다.",
    coords: [127.4296, 36.3286],
    place: "성심당 본점",
    photoUrl: "/demo-photos/sungsimdang.svg",
  },

  // ── 부산 ──
  {
    id: "demo-busan-1",
    date: "2026-03-05T11:20:00+09:00",
    title: "해운대 모래",
    body: "겨울 끝의 바닷가. 신발에 모래가 들어와도 좋았다.",
    coords: [129.1604, 35.1587],
    place: "해운대 해수욕장",
    photoUrl: "/demo-photos/haeundae.svg",
  },
  {
    id: "demo-busan-2",
    date: "2026-03-12T20:35:00+09:00",
    title: "광안리 불꽃",
    body: "다리 위로 불빛이 흩어졌다. 주변 사람도 한순간 멈췄다.",
    coords: [129.1186, 35.1532],
    place: "광안리 해변",
  },
  {
    id: "demo-busan-3",
    date: "2026-03-19T16:05:00+09:00",
    title: "감천 골목",
    body: "색이 모여 마을이 되는 풍경. 골목마다 다른 시간이 흘렀다.",
    coords: [129.0103, 35.0972],
    place: "감천문화마을",
    photoUrl: "/demo-photos/gamcheon.svg",
  },

  // ── 대구 ──
  {
    id: "demo-daegu-1",
    date: "2026-04-02T14:45:00+09:00",
    title: "동성로 봄",
    body: "벚꽃이 채 지지 않은 거리. 카페 음악이 골목으로 새어 나왔다.",
    coords: [128.5944, 35.8689],
    place: "동성로",
  },
  {
    id: "demo-daegu-2",
    date: "2026-04-09T18:20:00+09:00",
    title: "수성못 저녁",
    body: "노을이 물 위에 깔리던 시간. 누군가 휘파람을 불었다.",
    coords: [128.6249, 35.8333],
    place: "수성못",
    photoUrl: "/demo-photos/suseong.svg",
  },
  {
    id: "demo-daegu-3",
    date: "2026-04-15T10:00:00+09:00",
    title: "앞산 정상",
    body: "도시가 발 아래로 펼쳐지자 모든 게 작아 보였다.",
    coords: [128.5836, 35.8259],
    place: "앞산공원",
  },

  // ── 광주 ──
  {
    id: "demo-gwangju-1",
    date: "2026-04-23T15:25:00+09:00",
    title: "양림동 골목",
    body: "오래된 양옥과 빛바랜 페인트. 시간이 천천히 흐르는 동네.",
    coords: [126.9214, 35.1407],
    place: "양림동",
  },
  {
    id: "demo-gwangju-2",
    date: "2026-04-29T17:40:00+09:00",
    title: "충장로 사람들",
    body: "토요일 오후의 활기. 누군가의 첫 데이트, 누군가의 마지막.",
    coords: [126.9176, 35.1462],
    place: "충장로",
  },
  {
    id: "demo-gwangju-3",
    date: "2026-05-02T09:15:00+09:00",
    title: "무등산 능선",
    body: "바람이 정말 잘 부는 곳. 머리도 마음도 가벼워진다.",
    coords: [126.9766, 35.1319],
    place: "무등산",
    photoUrl: "/demo-photos/mudeung.svg",
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
  updateDraft: (partial) =>
    set((s) => (s.draft ? { draft: { ...s.draft, ...partial } } : s)),
  cancelDraft: () => set({ draft: null }),
}));