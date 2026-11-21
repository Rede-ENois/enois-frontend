export type SanctionEvidence =
  { kind: "UNAVAILABLE"; text: null } | { kind: "TEXT" | "MEDIA" | "BEHAVIOR"; text: string };
