export type LogEntry = {
  id: string;
  /** ISO date string */
  date: string;
  title: string;
  body: string;
  /** lng, lat — GeoJSON order */
  coords: [number, number];
  /** Optional place label (e.g. reverse-geocoded or user-typed) */
  place?: string;
  /** Storage path within the photos bucket. Resolves to a public URL. */
  photoPath?: string;
};

export type LogRow = {
  id: string;
  user_id: string;
  date: string;
  title: string;
  body: string;
  place: string | null;
  lng: number;
  lat: number;
  photo_path: string | null;
  created_at: string;
};

export function rowToEntry(r: LogRow): LogEntry {
  return {
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
    coords: [r.lng, r.lat],
    place: r.place ?? undefined,
    photoPath: r.photo_path ?? undefined,
  };
}