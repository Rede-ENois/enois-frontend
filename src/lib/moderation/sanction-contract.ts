import type { MySanctionsResponse } from "@/types/application/moderation/my-sanctions-response";
import { z } from "zod";

const instant = z.iso.datetime({ offset: true });
const deadline = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("NONE"), at: z.null() }),
  z.object({ kind: z.literal("APPEAL"), at: instant }),
  z.object({ kind: z.literal("END"), at: instant }),
]);
const evidence = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("UNAVAILABLE"), text: z.null() }),
  z.object({ kind: z.literal("TEXT"), text: z.string() }),
  z.object({ kind: z.literal("MEDIA"), text: z.string() }),
  z.object({ kind: z.literal("BEHAVIOR"), text: z.string() }),
]);
const sanction = z.object({
  id: z.string(),
  userId: z.string(),
  reportId: z.string().nullable(),
  type: z.enum(["RESTRICTION", "SUSPENDED", "BAN", "PERMABAN"]),
  reason: z.string().nullable(),
  status: z.enum(["ACTIVE", "REMOVED"]),
  createdAt: instant,
  removedAt: instant.nullable(),
  deadline,
  evidence,
  canAppeal: z.boolean(),
  dueAt: instant.nullable().optional(),
});
const appeal = z.object({
  id: z.string(),
  sanctionId: z.string(),
  userId: z.string(),
  message: z.string(),
  status: z.enum(["PENDING", "APPROVED", "DENIED"]),
  createdAt: instant,
  reviewedBy: z.string().nullable(),
  reviewedAt: instant.nullable(),
});
const response = z.object({
  serverNow: instant,
  sanctions: z.array(sanction),
  appeals: z.array(appeal),
});

export function parseMySanctions(value: unknown): MySanctionsResponse {
  return response.parse(value);
}
