import type { StudyPairIcebreakerAnswers } from "./study-pair-icebreaker-answers";
import type { StudyPairPartnerView } from "./study-pair-partner-view";

/** Uma proposta de par como o app recebe do servidor, antes de virar o que a tela desenha. */
export type StudyPairProposalView = {
  id: string;
  goal: string;
  goalKey: string;
  topic: string | null;
  partner: StudyPairPartnerView;
  myAccepted: boolean;
  partnerAccepted: boolean;
  /** Só chega depois do meu aceite (a revelação é simétrica); antes disso é `null`. */
  partnerIcebreaker: StudyPairIcebreakerAnswers | null;
  deadline: string;
};
