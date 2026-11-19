import { texts } from "@/texts";
import type { StudyPairIcebreakerField as IcebreakerFieldView } from "@/types/application/study-pairs/study-pair-icebreaker-field";
import type { StudyPairProposalView } from "@/types/application/study-pairs/study-pair-proposal-view";
import type { StudyPairIcebreakerField, StudyPairProposal } from "@rede-enois/design-system/domain";

import { dataSemAno } from "@/lib/date/format";

const copy = texts.studyPairs.proposals;

function known(id: string) {
  return copy.fields[id as keyof typeof copy.fields] as
    { question: string; placeholder?: string; options?: readonly string[] } | undefined;
}

/**
 * As perguntas vêm do catálogo do servidor (e mudam sem deploy); os textos do app só traduzem pelo
 * id. Pergunta nova aparece com o texto do servidor, sem desaparecer do formulário.
 */
export function toIcebreakerField(field: IcebreakerFieldView): StudyPairIcebreakerField {
  const text = known(field.id);
  return {
    id: field.id,
    question: text?.question ?? field.question,
    required: field.required,
    options: text?.options ? [...text.options] : [...field.options],
    placeholder: text?.placeholder,
  };
}

/** A proposta como a tela de propostas do DS a desenha: datas já formatadas e o link do perfil. */
export function toStudyPairProposal(proposal: StudyPairProposalView): StudyPairProposal {
  return {
    id: proposal.id,
    goal: proposal.goal,
    partner: {
      id: proposal.partner.id,
      username: proposal.partner.username,
      name: proposal.partner.name,
      avatarUrl: proposal.partner.avatar,
      href: `/perfil/${proposal.partner.username}`,
    },
    myAccepted: proposal.myAccepted,
    partnerAccepted: proposal.partnerAccepted,
    partnerIcebreaker: proposal.partnerIcebreaker,
    deadlineLabel: dataSemAno(proposal.deadline),
  };
}
