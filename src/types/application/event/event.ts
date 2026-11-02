import type { EventRecurrence } from "./event-recurrence";

export type Event = {
  id: string;
  title: string;
  date: string;
  time: string;
  format: "ONLINE" | "IN_PERSON" | "HYBRID";
  host: string;
  attendees: number;
  cover: string | null;
  /** Link da transmissao ao vivo (online/hibrido) — vira o botao "Assistir ao vivo". */
  streamUrl: string | null;
  /** Onde o evento acontece (presencial/hibrido). */
  location: string | null;
  /** Cidade e UF estruturadas (presencial/híbrido); ausentes no evento online. */
  city?: string | null;
  state?: string | null;
  /** O evento já aconteceu: sai da vitrine e não aceita mais confirmação de presença. */
  expired: boolean;
  /** Viewer confirmed attendance (false without session). */
  attending: boolean;
  /** Missing on older payloads: read as `NONE`. */
  recurrence?: EventRecurrence;
  /** Id of the first occurrence of the series; null for a one-off event. */
  seriesId?: string | null;
  /** Next date of the series (`YYYY-MM-DD`); null for a one-off event. */
  nextOccurrenceDate?: string | null;
  /** True only when the signed-in viewer created the event. */
  canManageRecurrence?: boolean;
};
