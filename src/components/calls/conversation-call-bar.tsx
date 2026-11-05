import { texts } from "@/texts";
import { isTerminalState } from "@/types/application/call/is-terminal-state";
import { Button } from "@rede-enois/design-system/ui";
import { Phone, Video } from "lucide-react";

import { useCalls, useOpenCall } from "./calls-provider";

/**
 * Ligações de uma conversa 1:1: ligar (áudio/vídeo) e entrar na chamada que estiver aberta.
 *
 * No 1:1 a chamada é sempre dos dois — não tem "entrar sem incomodar", então o banner só aparece
 * enquanto ela existe e some quando termina.
 */
export function ConversationCallBar({ conversationId }: { conversationId: string }) {
  const calls = useCalls();
  const { call } = useOpenCall({ conversationId });
  const ringing = call !== null && !isTerminalState(call.state) && call.state !== "ACTIVE";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {ringing && call ? (
        <p className="min-w-0 flex-1 truncate text-sm text-text-strong" aria-live="polite">
          {call.isInitiator ? texts.calls.ringing : texts.calls.incoming(call.displayName)}
        </p>
      ) : null}

      {call && call.state === "ACTIVE" ? (
        <Button size="sm" className="w-auto rounded-full" onClick={() => void calls.open(call.id)}>
          {texts.calls.join}
        </Button>
      ) : (
        <>
          <Button
            size="sm"
            variant="outline"
            className="w-auto rounded-full gap-1.5"
            aria-label={texts.calls.audioTitle}
            onClick={() => void calls.startDirect(conversationId, "AUDIO")}
          >
            <Phone className="h-3.5 w-3.5" />

            <>{texts.calls.startAudio}</>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="w-auto rounded-full gap-1.5"
            aria-label={texts.calls.videoTitle}
            onClick={() => void calls.startDirect(conversationId, "VIDEO")}
          >
            <Video className="h-3.5 w-3.5" />

            <>{texts.calls.startVideo}</>
          </Button>
        </>
      )}
    </div>
  );
}
