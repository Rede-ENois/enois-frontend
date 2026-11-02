import type { Message } from "@/types/application/message/message";
import type { ConversationPeerData } from "@rede-enois/design-system/domain";

export type MessageBubbleProps = {
  message: Message;
  /** A mensagem é de quem está olhando a tela: muda o lado, a cor e o canto do balão. */
  isMe: boolean;
  /** O outro participante como ele aparece nesta conversa (identidade profissional em conversa de trabalho). */
  peer?: ConversationPeerData;
  /** Link do avatar dele (perfil social ou página profissional, conforme a conversa). */
  profileHref: string;
  /** Modo de seleção de mensagens: o clique passa a marcar o balão. */
  selecting?: boolean;
  selected?: boolean;
  /** Ausente quando o balão não aceita clique (filão da conversa anterior ainda na tela). */
  onToggleSelect?: () => void;
  /** Reagir ou desfazer. Ausente nas mesmas condições da seleção. */
  onReact?: (type: string) => void;
  /** Recibo de leitura: a outra pessoa já abriu a conversa depois desta mensagem. */
  readByOther?: boolean;
  /** Denunciar esta mensagem. */
  onReport?: () => void;
  /** Responder esta mensagem. */
  onReply?: () => void;
};
