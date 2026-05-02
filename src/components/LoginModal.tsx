"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Mail, ArrowRight, Loader2, Check, X, Lock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  sendMagicLink,
  signInWithPassword,
  signUpWithPassword,
} from "@/lib/auth";

type Mode = "password" | "magic";
type Phase = "idle" | "sending" | "sent" | "error";

export default function LoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<Mode>("password");
  const [isSignup, setIsSignup] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setPhase("idle");
      setErrorMsg(null);
      setPassword("");
      setTimeout(() => emailRef.current?.focus(), 80);
    }
  }, [open]);

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setPhase("sending");
    setErrorMsg(null);
    try {
      if (isSignup) {
        await signUpWithPassword(email, password);
      } else {
        await signInWithPassword(email, password);
      }
      // onAuthStateChange will fire and AuthBridge will refresh.
      onClose();
    } catch (err) {
      setPhase("error");
      const raw = err instanceof Error ? err.message : "로그인 실패";
      setErrorMsg(translateAuthError(raw));
    }
  }

  async function submitMagic(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setPhase("sending");
    setErrorMsg(null);
    try {
      await sendMagicLink(email);
      setPhase("sent");
    } catch (err) {
      setPhase("error");
      const raw = err instanceof Error ? err.message : "전송 실패";
      setErrorMsg(translateAuthError(raw));
    }
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="overlay"
          className="pointer-events-auto fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            paddingTop: "max(env(safe-area-inset-top), 1rem)",
            paddingBottom: "max(env(safe-area-inset-bottom), 1rem)",
            paddingLeft: "max(env(safe-area-inset-left), 1rem)",
            paddingRight: "max(env(safe-area-inset-right), 1rem)",
          }}
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
            className="glass relative w-full max-w-[400px] max-h-full overflow-y-auto rounded-3xl"
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
                {mode === "password"
                  ? isSignup
                    ? "새 계정 만들기"
                    : "로그인"
                  : "메일 한 통으로 시작"}
              </h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--fg-muted)]">
                {mode === "password"
                  ? isSignup
                    ? "이메일과 비밀번호만 있으면 즉시 시작할 수 있어요."
                    : "기존 계정으로 들어가요."
                  : "메일에서 받은 링크 한 번이면 끝나요."}
              </p>

              {mode === "password" ? (
                <form onSubmit={submitPassword} className="mt-6 space-y-2.5">
                  <div className="hairline rounded-2xl flex items-center gap-2 px-3 py-2.5 bg-white/[0.04]">
                    <Mail size={14} className="opacity-60" />
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="input-bare text-[14px]"
                      disabled={phase === "sending"}
                    />
                  </div>

                  <div className="hairline rounded-2xl flex items-center gap-2 px-3 py-2.5 bg-white/[0.04]">
                    <Lock size={14} className="opacity-60" />
                    <input
                      type="password"
                      autoComplete={
                        isSignup ? "new-password" : "current-password"
                      }
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={
                        isSignup ? "비밀번호 (6자 이상)" : "비밀번호"
                      }
                      className="input-bare text-[14px]"
                      disabled={phase === "sending"}
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-[12px] text-rose-300/80">{errorMsg}</p>
                  )}

                  <button
                    type="submit"
                    disabled={
                      !email.trim() ||
                      password.length < 6 ||
                      phase === "sending"
                    }
                    className="btn-primary w-full flex items-center justify-center gap-1.5 mt-1"
                  >
                    {phase === "sending" ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <ArrowRight size={14} />
                    )}
                    {phase === "sending"
                      ? isSignup
                        ? "만드는 중…"
                        : "들어가는 중…"
                      : isSignup
                        ? "가입하기"
                        : "로그인"}
                  </button>

                  <div className="flex flex-col items-stretch gap-2 pt-3 text-[12.5px]">
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignup((v) => !v);
                        setErrorMsg(null);
                      }}
                      className="text-left text-[var(--fg-muted)] hover:text-white transition-colors py-1"
                    >
                      {isSignup
                        ? "← 기존 계정으로 로그인"
                        : "처음이세요? 가입하기 →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("magic");
                        setErrorMsg(null);
                      }}
                      className="text-left text-[var(--fg-faint)] hover:text-white transition-colors py-1"
                    >
                      메일 링크로 받기
                    </button>
                  </div>
                </form>
              ) : phase !== "sent" ? (
                <form onSubmit={submitMagic} className="mt-6">
                  <div className="hairline rounded-2xl flex items-center gap-2 px-3 py-2.5 bg-white/[0.04]">
                    <Mail size={14} className="opacity-60" />
                    <input
                      ref={emailRef}
                      type="email"
                      inputMode="email"
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

                  <button
                    type="button"
                    onClick={() => {
                      setMode("password");
                      setErrorMsg(null);
                    }}
                    className="mt-3 w-full text-[12.5px] text-[var(--fg-muted)] hover:text-white transition-colors"
                  >
                    ← 비밀번호로 로그인
                  </button>
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
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function translateAuthError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("rate limit")) {
    return "이메일 전송 한도에 걸렸어요. 비밀번호 로그인을 사용하거나 1시간 뒤 다시 시도해주세요.";
  }
  if (m.includes("invalid login credentials") || m.includes("invalid email or password")) {
    return "이메일 또는 비밀번호가 맞지 않아요. 처음이라면 '가입하기'를 눌러주세요.";
  }
  if (m.includes("user already registered") || m.includes("already registered")) {
    return "이미 가입된 이메일이에요. '기존 계정으로 로그인'으로 돌아가 주세요.";
  }
  if (m.includes("password") && m.includes("short")) {
    return "비밀번호는 6자 이상이어야 해요.";
  }
  if (m.includes("email") && m.includes("invalid")) {
    return "올바른 이메일 형식이 아니에요.";
  }
  return msg;
}
