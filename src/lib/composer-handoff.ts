/**
 * Files picked on a composer shortcut outside the feed (the profile's "Foto"/"Vídeo") travel to the
 * feed composer here. The picker must open inside the click, so the files exist before the
 * navigation; File objects do not fit in the URL. In memory only: a reload drops them, by design.
 */
let pending: File[] = [];

export function handOffComposerFiles(files: File[]): void {
  pending = files;
}

/** Returns the handed-off files once; the next call gets an empty list. */
export function takeComposerFiles(): File[] {
  const files = pending;
  pending = [];
  return files;
}
