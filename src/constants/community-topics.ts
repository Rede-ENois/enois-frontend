import { texts } from "@/texts";

export const TOPICS = [
  "Todas",
  "TECNOLOGIA",
  "ENGENHARIA",
  "DESIGN",
  "PRODUTO",
  "LIDERANCA",
  "CARREIRA",
  "FREELANCE",
] as const;

export const TOPIC_LABELS: Record<(typeof TOPICS)[number], string> = {
  Todas: texts.communities.topics.all,
  TECNOLOGIA: texts.communities.topics.TECNOLOGIA,
  ENGENHARIA: texts.communities.topics.ENGENHARIA,
  DESIGN: texts.communities.topics.DESIGN,
  PRODUTO: texts.communities.topics.PRODUTO,
  LIDERANCA: texts.communities.topics.LIDERANCA,
  CARREIRA: texts.communities.topics.CARREIRA,
  FREELANCE: texts.communities.topics.FREELANCE,
};
