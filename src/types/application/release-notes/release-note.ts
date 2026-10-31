import type { ReleaseNoteItem } from "./release-note-item";

/** The "O que há de novo" release on air. `updatedAt` is its version: a republish reopens the popup. */
export type ReleaseNote = {
  id: string;
  items: ReleaseNoteItem[];
  publishedAt: string;
  updatedAt: string;
};
