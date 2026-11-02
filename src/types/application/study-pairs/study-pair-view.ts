import type { StudyPairCheckinView } from "./study-pair-checkin-view";
import type { StudyPairPartnerView } from "./study-pair-partner-view";

export type StudyPairView = {
  id: string;
  goal: string;
  goalKey: string;
  topic: string | null;
  startedAt: string;
  /** Current ISO week. */
  weekKey: string;
  partner: StudyPairPartnerView;
  myCheckinThisWeek: boolean;
  partnerCheckinThisWeek: boolean;
  /** Current week and the 3 before it, newest first. */
  checkins: StudyPairCheckinView[];
};
