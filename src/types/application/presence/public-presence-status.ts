import type { PresenceStatus } from "./presence-status";

export type PublicPresenceStatus = Exclude<PresenceStatus, "INVISIBLE"> | "OFFLINE";
