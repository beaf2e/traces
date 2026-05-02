"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Camera, X, Loader2, LogIn, MapPin, ImageIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { useSession } from "@/lib/auth";
import { fileToCompressedDataURL } from "@/lib/utils";
import { extractGPS } from "@/lib/exif";
import LoginModal from "./LoginModal";

export default function AddLogPanel() {
  const { user } = useSession();
  const draft = useStore((s) => s.draft);
  const cancel = useStore((s) => s.cancelDraft);
  const updateDraft = useStore((s) => s.updateDraft);
  const addLog = useStore((s) => s.addLog);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [place, setPlace] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [photoFromExif, setPhotoFromExif] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (draft) {
      setTitle("");
      setBody("");
      setPlace(draft.place ?? "");
      setPhoto(undefined);
      setPhotoFromExif(false);
      // Don't autofocus on mobile — keyboard would cover the photo button.
      // Only focus title if there's already a hardware keyboard / desktop.
      if (typeof window !== "undefined" && window.innerWidth >= 768) {
        setTimeout(() => titleRef.current?.focus(), 80);
      }
    }
  }, [draft]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const [gps, dataUrl] = await Promise.all([
        extractGPS(f),
        fileToCompressedDataURL(f),
      ]);
      setPhoto(dataUrl);
      if (gps) {
        updateDraft({ coords: gps });
        setPhotoFromExif(true);
      } else {
        setPhotoFromExif(false);
      }
    } finally {
      setBusy(false);
      e.target.value = ""; // allow re-picking the same file
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
            className="glass pointer-events-auto absolute z-40 rounded-3xl overflow-hidden flex flex-col
              inset-x-3 bottom-3 max-h-[88dvh]
              md:inset-auto md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:w-[460px] md:max-w-[calc(100vw-2rem)] md:max-h-[80vh]"
            style={{
              paddingBottom: "max(env(safe-area-inset-bottom), 0px)",
            }}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
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
              <div className="flex-1 min-h-0 overflow-y-auto scroll-thin">
                {/* Photo zone — prominent on mobile so it's the obvious first action */}
                <div className="px-5 pt-1 pb-3">
                  {photo ? (
                    <div className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt=""
                        className="w-full h-40 md:h-36 object-cover rounded-xl hairline"
                      />
                      <div className="absolute right-2 top-2 flex gap-1.5">
                        <button
                          onClick={() => cameraRef.current?.click()}
                          className="glass rounded-full p-1.5"
                          aria-label="다시 찍기"
                          title="다시 찍기"
                        >
                          <Camera size={13} />
                        </button>
                        <button
                          onClick={() => galleryRef.current?.click()}
                          className="glass rounded-full p-1.5"
                          aria-label="갤러리에서 변경"
                          title="갤러리"
                        >
                          <ImageIcon size={13} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => cameraRef.current?.click()}
                        disabled={busy}
                        className="h-32 md:h-28 rounded-xl border border-dashed border-[var(--line-strong)] grid place-items-center text-[var(--fg-muted)] hover:border-white/30 hover:text-white hover:bg-white/[0.03] transition-colors disabled:opacity-50"
                      >
                        {busy ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <span className="flex flex-col items-center gap-1.5">
                            <Camera size={20} />
                            <span className="text-[12.5px] font-medium">사진 찍기</span>
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => galleryRef.current?.click()}
                        disabled={busy}
                        className="h-32 md:h-28 rounded-xl border border-dashed border-[var(--line-strong)] grid place-items-center text-[var(--fg-muted)] hover:border-white/30 hover:text-white hover:bg-white/[0.03] transition-colors disabled:opacity-50"
                      >
                        <span className="flex flex-col items-center gap-1.5">
                          <ImageIcon size={20} />
                          <span className="text-[12.5px]">갤러리에서</span>
                        </span>
                      </button>
                    </div>
                  )}
                  {/* iOS opens camera directly with capture="environment". Other browsers fall back to default file picker. */}
                  <input
                    ref={cameraRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={onPickFile}
                    className="hidden"
                  />
                  <input
                    ref={galleryRef}
                    type="file"
                    accept="image/*"
                    onChange={onPickFile}
                    className="hidden"
                  />
                  {photoFromExif && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[var(--fg-muted)]">
                      <MapPin size={11} className="opacity-70" />
                      사진의 위치 정보를 사용했어요
                    </div>
                  )}
                </div>

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

                <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[var(--line)] shrink-0 sticky bottom-0 bg-[var(--bg-card)] backdrop-blur-xl">
                  <span className="text-[10.5px] text-[var(--fg-faint)] tabular-nums truncate">
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
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
