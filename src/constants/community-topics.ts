import { texts } from "@/texts";

export const COMMUNITY_TOPICS = [
  { value: "Todas", label: texts.communities.topics.all },
  { value: "TECNOLOGIA", label: texts.communities.topics.TECNOLOGIA },
  { value: "ENGENHARIA", label: texts.communities.topics.ENGENHARIA },
  { value: "DESIGN", label: texts.communities.topics.DESIGN },
  { value: "PRODUTO", label: texts.communities.topics.PRODUTO },
  { value: "LIDERANCA", label: texts.communities.topics.LIDERANCA },
  { value: "CARREIRA", label: texts.communities.topics.CARREIRA },
  { value: "FREELANCE", label: texts.communities.topics.FREELANCE },
] as const;
