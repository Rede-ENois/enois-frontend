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
 * entrar.
 */
export function TamoJuntoBar({ groupId }: { groupId: string }) {
  const calls = useCalls();
  const { call } = useOpenCall({ groupId });
  const open = call !== null && !isTerminalState(call.state);

  if (open && call) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text-strong" aria-live="polite">
            {texts.calls.tamoJuntoLive}
          </p>

          <p className="text-xs text-text-subtle">
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
        onClick={() => void calls.startGroup(groupId, "AUDIO")}
      >
        <Phone className="h-3.5 w-3.5" />

        <>{texts.calls.tamoJunto}</>
      </Button>

      <Button
        size="sm"
        variant="outline"
        className="w-auto rounded-full gap-1.5"
        aria-label={texts.calls.startVideo}
        onClick={() => void calls.startGroup(groupId, "VIDEO")}
      >
        <Video className="h-3.5 w-3.5" />

        <>{texts.calls.startVideo}</>
      </Button>
    </div>
  );
}
