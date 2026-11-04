import { texts } from "@/texts";
import type { CallState } from "@/types/application/call/call-state";

/** Nome do estado para a tela ("Chamando…", "Em andamento"). */
export function stateLabel(state: CallState): string {
  switch (state) {
    case "INITIATING":
    case "RINGING":
      return texts.calls.ringing;
    case "CONNECTING":
      return texts.calls.connecting;
    case "ACTIVE":
      return texts.calls.active;
    case "DECLINED":
      return texts.calls.declined;
    case "MISSED":
      return texts.calls.missed;
    case "CANCELLED":
      return texts.calls.cancelled;
    case "ENDED":
      return texts.calls.ended;
    case "FAILED":
      return texts.calls.failed;
  }
}
