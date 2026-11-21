export type SanctionDeadline = { kind: "NONE"; at: null } | { kind: "APPEAL" | "END"; at: string };
