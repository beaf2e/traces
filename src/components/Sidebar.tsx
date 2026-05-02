"use client";

import { motion } from "framer-motion";
import { Compass, Plus, Locate, LogIn, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore, DEMO_LOG_IDS } from "@/lib/store";
import { formatDate } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth";
import SearchBar from "./SearchBar";
import LoginModal from "./LoginModal";

export default function Sidebar() {
  const { user, loading: authLoading } = useSession();
  const logs = useStore((s) => s.logs);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const startDraft = useStore((s) => s.startDraft);
  const dataLoading = useStore((s) => s.loading);

  const [loginOpen, setLoginOpen] = useState(false);

  const sorted = useMemo(
    () =>
      [...logs].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [logs],
  );

  const isDemo = !user;
  const empty = !isDemo && sorted.length === 0;

  function locateMe() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        startDraft({ coords: [pos.coords.longitude, pos.coords.latitude] });
      },
      () => {
        startDraft({ coords: [127.4892, 36.6376] });
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <>
      <motion.aside
        initial={{ x: -16, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="glass pointer-events-auto absolute z-20 left-5 top-5 bottom-5 w-[300px] max-w-[calc(100vw-2.5rem)] rounded-3xl flex flex-col"
      >
        <header className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            <Compass size={18} className="opacity-90" />
            <h1 className="text-[17px] font-semibold tracking-tight">traces</h1>
          </div>
          <p className="mt-1.5 text-[12.5px] text-[var(--fg-muted)] leading-snug">
            {isDemo
              ? "지금 보는 건 데모 기록이에요. 로그인하면 나만의 지도가 시작됩니다."
              : "지도를 클릭해 그 자리에 오늘의 기록을 남기세요."}
          </p>
        </header>

        {/* User pill */}
        <div className="px-5 pb-3">
          {authLoading ? (
            <div className="h-7 w-32 rounded-full bg-white/[0.04] animate-pulse" />
          ) : user ? (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-white/15 grid place-items-center text-[10.5px] font-semibold">
                  {(user.email ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <span className="text-[12px] text-[var(--fg-muted)] truncate">
                  {user.email}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-ghost p-1.5 rounded-full shrink-0"
                title="로그아웃"
                aria-label="로그아웃"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setLoginOpen(true)}
              className="btn-primary w-full flex items-center justify-center gap-1.5"
            >
              <LogIn size={13} />
              로그인 / 가입
            </button>
          )}
        </div>

        {user && (
          <div className="px-4 pb-3 flex items-center gap-2">
            <button onClick={locateMe} className="btn-primary flex items-center gap-1.5">
              <Locate size={14} />
              현재 위치
            </button>
            <button
              onClick={() => startDraft({ coords: [127.4892, 36.6376] })}
              className="btn-ghost flex items-center gap-1 text-[12.5px]"
              title="지도를 클릭하는 대신 기본 위치로 새 기록 작성"
            >
              <Plus size={13} />
              빈 기록
            </button>
          </div>
        )}

        {user && <SearchBar />}

        <div className="px-4 pb-2 text-[10.5px] uppercase tracking-[0.18em] text-[var(--fg-faint)] flex items-center justify-between">
          <span>
            {isDemo ? "데모" : "타임라인"} · {sorted.length}
          </span>
          {dataLoading && (
            <span className="normal-case tracking-normal text-[10px] text-[var(--fg-faint)]">
              불러오는 중…
            </span>
          )}
        </div>

        <ul className="scroll-thin flex-1 overflow-y-auto px-2 pb-4 space-y-1">
          {sorted.map((log, i) => {
            const active = log.id === selectedId;
            return (
              <li key={log.id}>
                <button
                  onClick={() => select(log.id)}
                  className={`w-full text-left rounded-2xl px-3 py-2.5 transition-colors ${
                    active ? "bg-white/8" : "hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-[14px] font-medium tracking-tight truncate ${
                        active ? "text-white" : "text-[var(--fg)]/90"
                      }`}
                    >
                      {log.title}
                    </span>
                    <span className="shrink-0 text-[10.5px] tabular-nums text-[var(--fg-faint)]">
                      {DEMO_LOG_IDS.has(log.id) ? "demo" : `#${sorted.length - i}`}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11.5px] text-[var(--fg-faint)]">
                    {formatDate(log.date)}
                    {log.place ? ` · ${log.place}` : ""}
                  </div>
                </button>
              </li>
            );
          })}
          {empty && (
            <li className="px-3 py-6 text-[13px] text-[var(--fg-faint)] text-center">
              아직 기록이 없어요. <br />
              지도 어딘가를 눌러보세요.
            </li>
          )}
        </ul>

        <footer className="px-5 py-3 border-t border-[var(--line)] text-[10.5px] text-[var(--fg-faint)] tracking-wider">
          © {new Date().getFullYear()} traces
        </footer>
      </motion.aside>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}