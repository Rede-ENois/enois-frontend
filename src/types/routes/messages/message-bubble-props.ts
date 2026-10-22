import type { Message } from "@/types/application/message/message";
import type { Profile } from "@/types/application/profile/profile";

export type MessageBubbleProps = {
  message: Message;
  /** A mensagem é de quem está olhando a tela: muda o lado, a cor e o canto do balão. */
  isMe: boolean;
  /** Perfil do outro participante — avatar e link ao lado das mensagens dele. */
  otherUser?: Profile;
  /** Id do outro participante; segura o link enquanto o perfil ainda não chegou. */
  otherId?: string;
  /** Modo de seleção de mensagens: o clique passa a marcar o balão. */
  selecting?: boolean;
  selected?: boolean;
  /** Ausente quando o balão não aceita clique (filão da conversa anterior ainda na tela). */
  onToggleSelect?: () => void;
  /** Reagir ou desfazer. Ausente nas mesmas condições da seleção. */
  onReact?: (type: string) => void;
  /** Recibo de leitura: a outra pessoa já abriu a conversa depois desta mensagem. */
  readByOther?: boolean;
};
