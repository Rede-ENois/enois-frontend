/** The area a notification belongs to, resolved by the backend (`NotificationModule`). */
export type NotificationModule =
  | "MESSAGES"
  | "EVENTS"
  | "JOBS"
  | "COMPANIES"
  | "MENTORING"
  | "DAILY_GAMES"
  | "COMMUNITY_GAMES"
  | "COMMUNITY_PROJECTS"
  | "GROUPS"
  | "STUDY_PAIRS"
  | "BLOGS"
  | "NETWORK"
  | "OTHER";
