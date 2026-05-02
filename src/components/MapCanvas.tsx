"use client";

import { useEffect, useMemo, useRef } from "react";
import Map, {
  Layer,
  Marker,
  Source,
  type MapRef,
  type MapMouseEvent,
} from "react-map-gl/maplibre";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import type { LogEntry } from "@/lib/types";

const MAP_STYLE =
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

const INITIAL_VIEW = {
  longitude: 127.4892,
  latitude: 36.6376,
  zoom: 11.4,
  pitch: 32,
  bearing: -8,
};

function sortByDate(logs: LogEntry[]) {
  return [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
}

export default function MapCanvas() {
  const mapRef = useRef<MapRef | null>(null);
  const logs = useStore((s) => s.logs);
  const selectedId = useStore((s) => s.selectedId);
  const select = useStore((s) => s.select);
  const startDraft = useStore((s) => s.startDraft);
  const draft = useStore((s) => s.draft);

  const sorted = useMemo(() => sortByDate(logs), [logs]);
  const lastId = sorted.at(-1)?.id;

  const pathGeo = useMemo(() => {
    return {
      type: "FeatureCollection" as const,
      features:
        sorted.length >= 2
          ? [
              {
                type: "Feature" as const,
                geometry: {
                  type: "LineString" as const,
                  coordinates: sorted.map((l) => l.coords),
                },
                properties: {},
              },
            ]
          : [],
    };
  }, [sorted]);

  // Fly to selected
  useEffect(() => {
    if (!selectedId) return;
    const target = logs.find((l) => l.id === selectedId);
    if (!target || !mapRef.current) return;
    mapRef.current.flyTo({
      center: target.coords,
      zoom: 13.4,
      speed: 0.9,
      curve: 1.4,
      essential: true,
    });
  }, [selectedId, logs]);

  // Fly to draft when starting one
  useEffect(() => {
    if (!draft || !mapRef.current) return;
    mapRef.current.flyTo({
      center: draft.coords,
      zoom: 14,
      speed: 0.9,
      curve: 1.3,
      essential: true,
    });
  }, [draft]);

  function onMapClick(e: MapMouseEvent) {
    // Ignore clicks on existing markers (those handle their own click)
    const target = e.originalEvent.target as HTMLElement | null;
    if (target?.closest("[data-marker]")) return;
    startDraft({ coords: [e.lngLat.lng, e.lngLat.lat] });
  }

  return (
    <Map
      ref={mapRef}
      initialViewState={INITIAL_VIEW}
      mapStyle={MAP_STYLE}
      onClick={onMapClick}
      style={{ width: "100%", height: "100%" }}
      attributionControl={{ compact: true }}
      cursor="crosshair"
    >
      {sorted.length >= 2 && (
        <Source id="path" type="geojson" data={pathGeo} lineMetrics>
          {/* Soft glow */}
          <Layer
            id="path-glow"
            type="line"
            paint={{
              "line-color": "rgba(255,255,255,0.18)",
              "line-width": 8,
              "line-blur": 6,
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
          {/* Crisp dashed line */}
          <Layer
            id="path-line"
            type="line"
            paint={{
              "line-color": "rgba(255,255,255,0.7)",
              "line-width": 1.4,
              "line-dasharray": [0.6, 1.6],
            }}
            layout={{ "line-cap": "round", "line-join": "round" }}
          />
        </Source>
      )}

      {sorted.map((log) => (
        <Marker
          key={log.id}
          longitude={log.coords[0]}
          latitude={log.coords[1]}
          anchor="center"
        >
          <button
            data-marker
            onClick={(e) => {
              e.stopPropagation();
              select(log.id);
            }}
            aria-label={log.title}
            className="relative grid place-items-center"
          >
            <span
              className={`node-dot ${log.id === lastId ? "node-pulse" : ""}`}
            />
          </button>
        </Marker>
      ))}

      {draft && (
        <Marker longitude={draft.coords[0]} latitude={draft.coords[1]} anchor="center">
          <motion.span
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="block w-4 h-4 rounded-full"
            style={{
              background: "transparent",
              border: "1.5px dashed rgba(255,255,255,0.85)",
              boxShadow: "0 0 24px 6px rgba(255,255,255,0.25)",
            }}
          />
        </Marker>
      )}
    </Map>
  );
}