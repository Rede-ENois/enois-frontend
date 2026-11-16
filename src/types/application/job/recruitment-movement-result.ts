import type { RecruitmentMovementKind } from "./recruitment-movement-kind";

/** O desfecho de um movimento: a linha gravada ou o erro explícito daquela candidatura. */
export type RecruitmentMovementResult = {
  id: string | null;
  applicationId: string;
  fromStageId: string | null;
  toStageId: string | null;
  kind: RecruitmentMovementKind;
  actorId: string;
  note: string | null;
  movedAt: string;
};
