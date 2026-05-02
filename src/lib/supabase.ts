"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// These are *public* values by design — the anon key is meant to ship in the
// client bundle, and Row Level Security enforces actual access. Reading from
// env first lets us point dev/preview at a different project if needed.
const FALLBACK_URL = "https://gcwscnmxklbflzqrgjmw.supabase.co";
const FALLBACK_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdjd3Njbm14a2xiZmx6cXJnam13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc3MDgxNzgsImV4cCI6MjA5MzI4NDE3OH0.3hjMB6lgWskpAyxMVgah67b2aVDfr0jlLSy_qrsTaE8";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON;

let cached: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return cached;
}

export const PHOTO_BUCKET = "photos";

export function publicPhotoUrl(path: string) {
  return supabase().storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}