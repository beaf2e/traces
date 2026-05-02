"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import MemoryCard from "@/components/MemoryCard";
import AddLogPanel from "@/components/AddLogPanel";
import AuthBridge from "@/components/AuthBridge";

const MapCanvas = dynamic(() => import("@/components/MapCanvas"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full grid place-items-center text-[var(--fg-faint)] text-sm">
      지도를 불러오는 중…
    </div>
  ),
});

export default function Home() {
  return (
    <main className="fixed inset-0">
      <AuthBridge />

      <div className="absolute inset-0">
        <MapCanvas />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            "radial-gradient(120% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      <div className="pointer-events-none">
        <Sidebar />
        <MemoryCard />
        <AddLogPanel />
      </div>
    </main>
  );
}