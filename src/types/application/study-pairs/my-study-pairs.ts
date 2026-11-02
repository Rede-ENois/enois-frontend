import type { StudyPairOpenRequestView } from "./study-pair-open-request-view";
import type { StudyPairView } from "./study-pair-view";

/** GET /study-pairs/me */
export type MyStudyPairs = {
  openRequest: StudyPairOpenRequestView | null;
  pairs: StudyPairView[];
};
