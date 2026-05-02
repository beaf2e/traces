"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, Check, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { sendMagicLink } from "@/lib/auth";

type Phase = "idle" | "sending" | "sent" | "error";

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [email, setEmail] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setErrorMsg(null);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase("sending");
    setErrorMsg(null);
    try {
      await sendMagicLink(email);
      setPhase("sent");
    } catch (err) {
      setPhase("error");
      setErrorMsg(err instanceof Error ? err.message : "전송 실패");
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="pointer-events-auto fixed inset-0 z-50 grid place-items-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <button
            aria-label="닫기"
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-md"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: 24, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="glass relative w-[400px] max-w-full rounded-3xl overflow-hidden"
          >
            <button
              onClick={onClose}
              aria-label="닫기"
              className="btn-ghost absolute right-3 top-3 p-1.5 rounded-full"
            >
              <X size={15} />
            </button>

            <div className="px-7 pt-8 pb-6">
              <div className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-faint)]">
                traces
              </div>
              <h2 className="mt-1.5 text-[22px] font-semibold tracking-tight leading-tight">
                나만의 지도를 시작하기
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--fg-muted)]">
                이메일만 있으면 됩니다. 메일로 보내드린 링크를 누르면 바로 로그인돼요.
              </p>

              {phase !== "sent" ? (
                <form onSubmit={submit} className="mt-6">
                  <div className="hairline rounded-2xl flex items-center gap-2 px-3 py-2.5 bg-white/[0.04]">
                    <Mail size={14} className="opacity-60" />
                    <input
                      ref={inputRef}
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-bare text-[14px]"
                      disabled={phase === "sending"}
                    />
                  </div>

                  {errorMsg && (
                    <p className="mt-2 text-[12px] text-rose-300/80">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!email.trim() || phase === "sending"}
                    className="btn-primary mt-4 w-full flex items-center justify-center gap-1.5"
                  >
                    {phase === "sending" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                    {phase === "sending" ? "보내는 중…" : "매직 링크 받기"}
                  </button>

                  <p className="mt-4 text-[11px] text-[var(--fg-faint)] leading-relaxed">
                    별도의 비밀번호는 없어요. 메일이 안 보이면 스팸함도 확인해주세요.
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <div className="flex items-center gap-2 text-[14px]">
                    <Check size={16} className="opacity-90" />
                    <span>
                      <strong className="font-semibold">{email}</strong> 으로
                      링크를 보냈어요.
                    </span>
                  </div>
                  <p className="mt-3 text-[12.5px] text-[var(--fg-muted)] leading-relaxed">
                    메일함에서 링크를 누르면 이 창으로 돌아와 로그인이 완료됩니다.
                    다른 기기에서 눌러도 됩니다.
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}