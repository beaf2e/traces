"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, X, Loader2, LogIn } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { fileToCompressedDataURL } from "@/lib/utils";
import LoginModal from "./LoginModal";

export default function AddLogPanel() {
  const { user } = useSession();
  const draft = useStore((s) => s.draft);
  const cancel = useStore((s) => s.cancelDraft);
  const addLog = useStore((s) => s.addLog);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [place, setPlace] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (draft) {
      setTitle("");
      setBody("");
      setPlace(draft.place ?? "");
      setPhoto(undefined);
      setTimeout(() => titleRef.current?.focus(), 80);
    }
  }, [draft]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const url = await fileToCompressedDataURL(f);
      setPhoto(url);
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!draft || !title.trim()) return;
    setSubmitting(true);
    try {
      await addLog({
        title: title.trim(),
        body: body.trim(),
        place: place.trim() || undefined,
        coords: draft.coords,
        photoDataUrl: photo,
        date: new Date().toISOString(),
      });
    } finally {
      setSubmitting(false);
    }
  }

  const blocked = !user;

  return (
    <>
      <AnimatePresence>
        {draft && (
          <motion.section
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
            className="glass pointer-events-auto absolute z-20 left-1/2 -translate-x-1/2 bottom-6 w-[460px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <div className="flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rounded-full bg-white" />
                <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                  새 기록
                </span>
              </div>
              <button
                onClick={cancel}
                aria-label="취소"
                className="btn-ghost p-1.5 rounded-full"
              >
                <X size={15} />
              </button>
            </div>

            {blocked ? (
              <div className="px-5 pt-2 pb-5">
                <p className="text-[14px] leading-relaxed text-[var(--fg)]/85">
                  이 자리에 기록을 남기려면 먼저 로그인하세요. 메일 링크 한 번이면 끝나요.
                </p>
                <button
                  onClick={() => setShowLogin(true)}
                  className="btn-primary mt-4 flex items-center gap-1.5"
                >
                  <LogIn size={13} />
                  로그인하고 기록 시작
                </button>
              </div>
            ) : (
              <>
                <div className="px-5 pb-3">
                  <input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목 — 이 순간을 한 줄로"
                    className="input-bare text-[18px] font-semibold tracking-tight py-2"
                    maxLength={60}
                  />
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="여기서 무엇을 보고, 느꼈는지…"
                    rows={3}
                    className="input-bare resize-none text-[14.5px] leading-[1.65] text-[var(--fg)]/85 py-1"
                    maxLength={400}
                  />
                  <input
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    placeholder="장소 (선택)"
                    className="input-bare text-[13px] text-[var(--fg-muted)] py-1.5"
                    maxLength={60}
                  />
                </div>

                {photo && (
                  <div className="px-5 pb-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo}
                      alt=""
                      className="w-full h-36 object-cover rounded-xl hairline"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--line)]">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="btn-ghost flex items-center gap-1.5 text-[12.5px]"
                    disabled={busy || submitting}
                  >
                    {busy ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Camera size={14} />
                    )}
                    {photo ? "사진 변경" : "사진 추가"}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-[var(--fg-faint)] tabular-nums">
                      {draft.coords[1].toFixed(4)}, {draft.coords[0].toFixed(4)}
                    </span>
                    <button
                      onClick={submit}
                      disabled={!title.trim() || submitting}
                      className="btn-primary flex items-center gap-1.5"
                    >
                      {submitting && (
                        <Loader2 size={13} className="animate-spin" />
                      )}
                      {submitting ? "저장 중" : "기록하기"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}