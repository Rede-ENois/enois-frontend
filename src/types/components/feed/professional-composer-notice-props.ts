export type ProfessionalComposerNoticeProps = {
  /** Why the professional composer is not offered. */
  state: "ERROR" | "NOT_READY";
  /** Asks the profile query again (only used in the ERROR state). */
  onRetry: () => void;
  retrying?: boolean;
};
