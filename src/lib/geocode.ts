export type GeocodeResult = {
  display_name: string;
  /** lng, lat — GeoJSON order */
  coords: [number, number];
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";

/**
 * Free OpenStreetMap geocoding. No API key required.
 * Nominatim asks callers to set a descriptive User-Agent and rate-limit
 * to ~1 req/s — we debounce in the UI to honor that.
 */
export async function geocode(query: string, signal?: AbortSignal): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = new URL(NOMINATIM);
  url.searchParams.set("q", q);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "6");
  url.searchParams.set("addressdetails", "0");
  url.searchParams.set("accept-language", "ko");

  const res = await fetch(url.toString(), {
    signal,
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
  const json = (await res.json()) as Array<{
    display_name: string;
    lat: string;
    lon: string;
  }>;
  return json.map((r) => ({
    display_name: r.display_name,
    coords: [parseFloat(r.lon), parseFloat(r.lat)] as [number, number],
  }));
}