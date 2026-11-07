import { texts } from "@/texts";
import { isTerminalState } from "@/types/application/call/is-terminal-state";
import { Button } from "@rede-enois/design-system/ui";
import { Phone, Video } from "lucide-react";

import { useCalls, useOpenCall } from "./calls-provider";

/**
 * "Tamo junto": a chamada do grupo.
 *
 * Diferente do 1:1, aqui ninguém é chamado no telefone — a chamada fica ao vivo e quem quiser
 * entra. Por isso não há toque, nem microfone/câmera ligados sozinhos: abrir a sala é escolher
 * entrar, e quem abre já entra.
 *
 * A chamada em grupo se chama sempre "Tamo junto"; o que muda é a mídia ("Tamo junto voz" ou
 * "Tamo junto vídeo"). Com `topicId`, a barra é a sala daquele tópico — cada tópico tem a sua,
 * independente da sala geral do grupo. O nome do tópico fica no botão, não num texto ao lado, para
 * a barra ser um componente só de views do design system.
 */
export function TamoJuntoBar({
  groupId,
  topicId,
  topicName,
}: {
  groupId: string;
  topicId?: string;
  topicName?: string;
}) {
  const calls = useCalls();
  const { call } = useOpenCall({ groupId, topicId });
  const open = call !== null && !isTerminalState(call.state);
  const mediaName =
    call?.kind === "VIDEO" ? texts.calls.tamoJuntoVideo : texts.calls.tamoJuntoAudio;
  const liveName = topicName ? texts.calls.tamoJuntoTopic(mediaName, topicName) : mediaName;
  // Só anuncia o tópico com o nome do tópico na tela; sem ele, o rótulo do botão já basta.
  const label = (name: string) =>
    topicName ? texts.calls.tamoJuntoTopic(name, topicName) : undefined;

  if (open && call) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-strong" aria-live="polite">
            {liveName}
          </p>

          <p className="text-xs text-text-subtle">
            {topicName ? texts.calls.tamoJuntoTopicLive(topicName) : texts.calls.tamoJuntoLive}
            {" · "}
            {texts.calls.participants(call.participantCount)}
          </p>
        </div>

        <Button size="sm" className="w-auto rounded-full" onClick={() => void calls.open(call.id)}>
          {texts.calls.join}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        className="w-auto rounded-full gap-1.5"
        aria-label={label(texts.calls.tamoJuntoAudio)}
        onClick={() => void calls.startGroup(groupId, "AUDIO", topicId)}
      >
        <Phone className="h-3.5 w-3.5" />

        <>{texts.calls.tamoJuntoAudio}</>
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-auto rounded-full gap-1.5"
        aria-label={label(texts.calls.tamoJuntoVideo)}
        onClick={() => void calls.startGroup(groupId, "VIDEO", topicId)}
      >
        <Video className="h-3.5 w-3.5" />

        <>{texts.calls.tamoJuntoVideo}</>
      </Button>
    </div>
  );
}
