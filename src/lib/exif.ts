import exifr from "exifr";

/**
 * Extract GPS coords from a photo File. Returns [lng, lat] (GeoJSON order)
 * if both are present, otherwise null.
 */
export async function extractGPS(
  file: File,
): Promise<[number, number] | null> {
  try {
    const gps = (await exifr.gps(file)) as
      | { latitude: number; longitude: number }
      | null
      | undefined;
    if (
      gps &&
      typeof gps.latitude === "number" &&
      typeof gps.longitude === "number" &&
      Number.isFinite(gps.latitude) &&
      Number.isFinite(gps.longitude)
    ) {
      return [gps.longitude, gps.latitude];
    }
  } catch {
    // EXIF parsing can throw on weird files; ignore and fall through.
  }
  return null;
}
