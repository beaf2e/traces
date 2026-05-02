import type { LogEntry } from "./types";

/** Default proximity threshold for "same trip / same city" clustering. */
export const CLUSTER_THRESHOLD_KM = 60;

function haversineKm(a: [number, number], b: [number, number]): number {
  const R = 6371;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

/**
 * Group logs into spatial clusters (e.g. "Cheongju trip", "Tokyo trip").
 * A log joins an existing cluster if it's within `thresholdKm` of any log
 * already in that cluster. Logs inside each cluster are returned sorted by
 * date ascending so they connect in chronological order.
 */
export function clusterByProximity(
  logs: LogEntry[],
  thresholdKm = CLUSTER_THRESHOLD_KM,
): LogEntry[][] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const clusters: LogEntry[][] = [];

  for (const log of sorted) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (const member of clusters[i]) {
        const d = haversineKm(log.coords, member.coords);
        if (d < bestDist && d <= thresholdKm) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }
    if (bestIdx >= 0) clusters[bestIdx].push(log);
    else clusters.push([log]);
  }

  // Each cluster sorted by date asc (input was pre-sorted but be defensive)
  for (const c of clusters) {
    c.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return clusters;
}
