import type { LogEntry } from "./types";

/** Default proximity threshold for "same trip / same city" clustering. */
export const CLUSTER_THRESHOLD_KM = 60;

/**
 * Default time-gap threshold. Two logs in the same place but separated by
 * more days than this are considered different trips/eras and get separate
 * clusters — so a 2020 Cheongju visit and a 2026 Cheongju visit don't get
 * drawn as one continuous line through 6 years.
 */
export const CLUSTER_GAP_DAYS = 90;

const DAY_MS = 86_400_000;

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
 * Group logs into clusters bounded in BOTH space and time.
 *
 * A log joins an existing cluster when it has at least one member that is
 * (a) within `thresholdKm` and (b) within `maxGapDays` of the new log's date.
 * Otherwise a new cluster is started.
 *
 * Effects:
 *  - Tokyo and Cheongju logs never share a cluster (spatial split).
 *  - Two visits to the same city years apart split into separate clusters.
 *  - Frequently-logged home city stays as one continuous cluster as long as
 *    consecutive logs are within `maxGapDays`.
 */
export function clusterByProximity(
  logs: LogEntry[],
  thresholdKm = CLUSTER_THRESHOLD_KM,
  maxGapDays = CLUSTER_GAP_DAYS,
): LogEntry[][] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const clusters: LogEntry[][] = [];
  const maxGapMs = maxGapDays * DAY_MS;

  for (const log of sorted) {
    const tNew = new Date(log.date).getTime();
    let bestIdx = -1;
    let bestDist = Infinity;

    for (let i = 0; i < clusters.length; i++) {
      for (const member of clusters[i]) {
        const d = haversineKm(log.coords, member.coords);
        if (d > thresholdKm) continue;
        const dt = Math.abs(tNew - new Date(member.date).getTime());
        if (dt > maxGapMs) continue;
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
    }

    if (bestIdx >= 0) clusters[bestIdx].push(log);
    else clusters.push([log]);
  }

  for (const c of clusters) {
    c.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  return clusters;
}
