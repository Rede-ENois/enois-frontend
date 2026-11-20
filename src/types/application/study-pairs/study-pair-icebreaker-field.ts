/** Uma pergunta do quebra-gelo (`GET /study-pairs/icebreakers`), na ordem do aceite. */
export type StudyPairIcebreakerField = {
  id: string;
  position: number;
  question: string;
  required: boolean;
  kind: "TEXT" | "SINGLE" | "MULTI";
  options: string[];
};
