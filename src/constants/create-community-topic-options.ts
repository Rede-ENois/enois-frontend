import { COMMUNITY_TOPICS } from "@/constants/community-topics";

export const CREATE_COMMUNITY_TOPIC_OPTIONS = COMMUNITY_TOPICS.filter(
  (option): option is Exclude<(typeof COMMUNITY_TOPICS)[number], { readonly value: "Todas" }> =>
    option.value !== "Todas",
);
