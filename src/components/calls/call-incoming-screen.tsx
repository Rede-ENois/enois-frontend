import { texts } from "@/texts";
import type { CallView } from "@/types/application/call/call-view";
import { Button, EmptyState, Pill } from "@rede-enois/design-system/ui";
import { Phone, PhoneOff, Video } from "lucide-react";

/**
 * Chamada recebida em tela inteira, como um discador.
 *
 * Aviso no canto não serve para uma ligação: a tela inteira e o nome grande são o que separam
 * "estou sendo chamada" de mais uma notificação. "Atender" e "Recusar" ficam os dois visíveis e do
 * mesmo tamanho — recusar não é opção escondida e atender não é caminho automático.
 *
 * Quando já há outra chamada na tela, ela aparece aqui e segue tocando: atender esta não pode
 * perdê-la.
 *
 * Só views do design system: o `EmptyState` já empilha os filhos no centro, então os botões entram
 * como filhos diretos e o tamanho padrão do `Button` (largura cheia) é o do discador.
 */
export function CallIncomingScreen({
  call,
  held,
  onAnswer,
  onDecline,
  onAnswerHeld,
  onDeclineHeld,
}: {
  call: CallView;
  held: CallView | null;
  onAnswer: () => void;
  onDecline: () => void;
  onAnswerHeld?: () => void;
  onDeclineHeld?: () => void;
}) {
  const isGroup = call.modality === "GROUP";
  const head = isGroup ? texts.calls.tamoJunto : texts.calls.audioTitle;

  return (
    <EmptyState
      icon={call.kind === "VIDEO" ? Video : Phone}
      title={call.displayName}
      description={`${head} · ${texts.calls.incoming(call.displayName)}`}
    >
      {held ? <Pill size="sm">{texts.calls.incomingHeld(held.displayName)}</Pill> : null}

      <Button
        variant="destructive"
        aria-label={held ? texts.calls.declineFrom(call.displayName) : undefined}
        onClick={onDecline}
      >
        <PhoneOff />

        {texts.calls.decline}
      </Button>

      <Button
        aria-label={held ? texts.calls.answerFrom(call.displayName) : undefined}
        onClick={onAnswer}
      >
        <Phone />

        {texts.calls.answer}
      </Button>

      {held && onAnswerHeld && onDeclineHeld ? (
        <>
          <Button
            variant="ghost"
            size="sm"
            aria-label={texts.calls.declineFrom(held.displayName)}
            onClick={onDeclineHeld}
          >
            {texts.calls.decline}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            aria-label={texts.calls.answerFrom(held.displayName)}
            onClick={onAnswerHeld}
          >
            {texts.calls.answerHeld}
          </Button>
        </>
      ) : null}
    </EmptyState>
  );
}
