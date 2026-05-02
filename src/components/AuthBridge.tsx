"use client";

import { useEffect } from "react";
import { useSession } from "@/lib/auth";
import { useStore } from "@/lib/store";

/**
 * Wires Supabase session state into the zustand store. When the user signs in
 * or out, this triggers a refresh (or reset to demo data).
 */
export default function AuthBridge() {
  const { user } = useSession();
  const setUser = useStore((s) => s.setUser);
  useEffect(() => {
    setUser(user?.id ?? null);
  }, [user?.id, setUser]);
  return null;
}