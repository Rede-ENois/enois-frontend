import { useEffect } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";

import { useCallSession } from "@/lib/calls/call-session";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { useCalls } from "@/components/calls/calls-provider";

/**
 * Link de chamada (`/call/{id}` — o endereço das notificações de chamada).
 *
 * Abrir esta rota não é uma chamada à parte: ela pede ao provider central que entre na sala e
 * volta de onde a pessoa veio (a conversa ou o grupo). O painel é o mesmo de dentro do app, sem
 * aba nova; por isso esta rota vive um instante só.
 */
export const Route = createFileRoute("/call/$callId")({
  beforeLoad: requireAuth,
  // Chamada é link pessoal: não é conteúdo para indexar nem para o preview de mensageiro.
  head: () => ({ meta: [{ title: texts.calls.audioTitle }] }),
  component: CallLanding,
});

function CallLanding() {
  const { callId } = Route.useParams();
  const navigate = useNavigate();
  const calls = useCalls();
  const session = useCallSession();

  useEffect(() => {
    void calls.open(callId);
    // Só quando o id muda: as ações do provider não precisam reabrir a chamada.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callId]);

  // Chamada já na tela (ou terminada com aviso): volta para o ponto de origem.
  useEffect(() => {
    if (session.phase === "idle") return;
    const origin = session.call;
    if (!origin || origin.id !== callId) return;
    if (origin.conversationId) {
      void navigate({ to: "/mensagens", search: { conversation: origin.conversationId } });
    } else if (origin.groupId) {
      void navigate({ to: "/mensagens" });
    }
  }, [session.phase, session.call, callId, navigate]);

  return (
    <AppContainer>
      <p className="py-16 text-center text-sm text-text-muted">{texts.calls.ringing}</p>
    </AppContainer>
  );
}
