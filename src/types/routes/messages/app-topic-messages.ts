import type { texts } from "@/texts";
import type { useMessages } from "@rede-enois/design-system";

import type { ConversationTopicMessages } from "./group-topics-answers";

export type { ConversationTopicMessages };

/** O `groupTopics` do nosso `texts`, comparado com o que o DS pede (ver `group-topics-answers`). */
export type AppTopicMessages = (typeof texts)["messages"]["groupTopics"];

export const topicTextsMatchDesignSystem: AppTopicMessages extends ConversationTopicMessages
  ? true
  : false = true;
/** O filtro dos tópicos usa `allTopics`, que vive no texto do próprio view. */
export const allTopicsInDesignSystem: "allTopics" extends keyof ConversationTopicMessages
  ? true
  : false = true;
