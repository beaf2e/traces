"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anon) {
  throw new Error(
    "Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
  );
}

let cached: SupabaseClient | null = null;
export function supabase(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(url!, anon!, {
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