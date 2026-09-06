export type ReportReason =
  | "AI_GENERATED"
  | "FAKE_CONTENT"
  | "SCAM"
  | "DISCRIMINATION"
  | "PREJUDICE"
  | "HARASSMENT"
  | "SPAM"
  | "VIOLENCE"
  | "COPYRIGHT"
  | "OTHER";

export type ReportInput = {
  targetId: string;
  targetType: "POST" | "COMMENT" | "USER";
  reason: ReportReason;
  description?: string;
};
