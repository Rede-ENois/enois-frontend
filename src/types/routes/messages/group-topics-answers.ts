import type { texts } from "@/texts";
import type { useMessages } from "@rede-enois/design-system";

/**
 * A conversa fala com o DS por material próprio: as views de tópico leem o `groupTopics` do
 * nosso `texts` em vez do pacote, e o tipo tem de encaixar no que o DS espera — se o DS exigir
 * uma chave que o app não tem, este arquivo para o typecheck. As comparações moram no
 * `app-topic-messages`, importado pela rota de mensagens.
 */
export type ConversationTopicMessages = ReturnType<typeof useMessages>["groupTopics"];
