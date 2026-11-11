/** Resultado da pré-checagem de limite de vídeo: cabe, ou o motivo da recusa. */
export type VideoLimitResult =
  | { ok: true }
  | { ok: false; reason: "size" | "duration" | "unreadable"; maxBytes: number; maxSeconds: number };
