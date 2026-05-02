"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Compass, Plus, Locate, LogIn, LogOut, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer when a memory is selected (so map/card is visible)
  useEffect(() => {
    if (selectedId) setMobileOpen(false);
  }, [selectedId]);

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
    setMobileOpen(false);
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

  function pickLog(id: string) {
    select(id);
    setMobileOpen(false);
  }

  return (
    <>
      {/* Mobile-only menu button — hidden when drawer is open */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="메뉴"
        className={`md:hidden pointer-events-auto absolute z-30 left-4 top-[calc(env(safe-area-inset-top)+1rem)] glass rounded-full w-11 h-11 grid place-items-center transition-opacity ${
          mobileOpen ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <Menu size={18} />
      </button>

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.button
            key="backdrop"
            aria-label="닫기"
            onClick={() => setMobileOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden pointer-events-auto fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          x: mobileOpen
            ? 0
            : typeof window !== "undefined" && window.innerWidth >= 768
              ? 0
              : -360,
        }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="glass pointer-events-auto absolute z-40 flex flex-col
          inset-y-0 left-0 w-[88vw] max-w-[340px] rounded-l-none rounded-r-3xl
          md:inset-y-5 md:left-5 md:bottom-5 md:w-[300px] md:rounded-3xl md:translate-x-0"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <header className="px-5 pt-5 pb-4 flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Compass size={18} className="opacity-90" />
              <h1 className="text-[17px] font-semibold tracking-tight">traces</h1>
            </div>
            <p className="mt-1.5 text-[12.5px] text-[var(--fg-muted)] leading-snug">
              {isDemo
                ? "지금 보는 건 데모 기록이에요. 로그인하면 나만의 지도가 시작됩니다."
                : "지도를 클릭하거나 + 버튼으로 그 자리에 기록을 남기세요."}
            </p>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="메뉴 닫기"
            className="md:hidden btn-ghost p-1.5 rounded-full -mr-1 -mt-1 shrink-0"
          >
            <X size={16} />
          </button>
        </header>

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
          <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
            <button onClick={locateMe} className="btn-primary flex items-center gap-1.5">
              <Locate size={14} />
              현재 위치
            </button>
            <button
              onClick={() => {
                startDraft({ coords: [127.4892, 36.6376] });
                setMobileOpen(false);
              }}
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
                  onClick={() => pickLog(log.id)}
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
