import type { StudyPairOpenRequestView } from "./study-pair-open-request-view";
import type { StudyPairProposalView } from "./study-pair-proposal-view";
import type { StudyPairView } from "./study-pair-view";

/** GET /study-pairs/me */
export type MyStudyPairs = {
  openRequest: StudyPairOpenRequestView | null;
  /** Casamentos esperando o aceite dos dois; vazio quando ninguém propôs. */
  proposals?: StudyPairProposalView[];
  pairs: StudyPairView[];
};
