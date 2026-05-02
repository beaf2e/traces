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
  /** Base64-encoded image (data URL). Optional. */
  photo?: string;
};