import type { AppealView } from "./appeal-view";
import type { SanctionView } from "./sanction-view";

export type MySanctionsResponse = {
  serverNow: string;
  sanctions: SanctionView[];
  appeals: AppealView[];
};
