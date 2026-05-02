"use client";

import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sb = supabase();
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export async function sendMagicLink(email: string) {
  const sb = supabase();
  const redirect =
    typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await sb.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirect, shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function signInWithPassword(email: string, password: string) {
  const sb = supabase();
  const { error } = await sb.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signUpWithPassword(email: string, password: string) {
  const sb = supabase();
  const { data, error } = await sb.auth.signUp({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  // With mailer_autoconfirm=true, signUp returns a session immediately.
  // If for some reason it didn't (project later requires confirmation),
  // fall through and let the caller surface a "check email" message.
  return data;
}

export async function signOut() {
  const sb = supabase();
  await sb.auth.signOut();
}

export type { Session, User };