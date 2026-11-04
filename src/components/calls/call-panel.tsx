import { useEffect, useRef, useState } from "react";

import { texts } from "@/texts";
import { callEmbedUrl } from "@/types/application/call/call-embed-url";
import { isTerminalState } from "@/types/application/call/is-terminal-state";
import { Button } from "@rede-enois/design-system/ui";
import { Minimize2, PhoneOff } from "lucide-react";

import { callSessionStore, useCallSession } from "@/lib/calls/call-session";
import { stateLabel } from "@/lib/calls/state-label";
import { useHangUp } from "@/lib/calls/use-hang-up";
import { cn } from "@/lib/utils";

import { useCalls } from "./calls-provider";

/**
 * Painel da chamada: overlay interno (não abre aba), minimizável, com o Jitsi embutido.
 *
 * A mídia (microfone, câmera, sair, participantes) fica na barra do próprio Jitsi — é a interface
 * dele, chamando o participante pelo nome da conta. Aqui ficam as ações que o app precisa
 * controlar: minimizar (sem largar a sala), encerrar/sair e atender/recusar.
 */
export function CallPanel() {
  const session = useCallSession();
  const calls = useCalls();
  const hangUp = useHangUp();
  const call = session.call;

  if (!call) return null;

  const title = call.kind === "VIDEO" ? texts.calls.videoTitle : texts.calls.audioTitle;
  const isGroup = call.modality === "GROUP";

  if (session.minimized && session.phase === "live") {
    return <CallPill title={isGroup ? texts.calls.tamoJunto : title} onExpand={expandCall} />;
  }

  return (
    <div
      className={cn(
        "fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border-soft bg-surface-1 shadow-2xl",
        "inset-x-2 bottom-2 max-h-[85vh] sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px]",
        session.phase === "live" ? "top-2 sm:top-auto sm:h-[560px]" : "",
      )}
      role="dialog"
      aria-label={title}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border-soft px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-strong">
            {isGroup ? `${texts.calls.tamoJunto} · ${call.displayName}` : call.displayName}
          </p>

          <p className="text-xs text-text-muted" aria-live="polite">
            {stateLabel(call.state)}
            {call.state === "ACTIVE" && call.participantCount > 0
              ? ` · ${texts.calls.participants(call.participantCount)}`
              : ""}
          </p>
        </div>

        {session.phase === "live" ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={texts.calls.minimize}
            onClick={() => callSessionStore.minimize()}
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        ) : null}
      </header>

      {session.phase === "live" && session.join ? (
        <CallFrame
          key={session.join.jwt}
          url={callEmbedUrl(session.join)}
          title={title}
          onClosed={() => callSessionStore.lostCredential()}
        />
      ) : null}

      <div className="flex flex-col gap-2 px-4 py-3">
        {session.notice ? <p className="text-xs text-text-muted">{session.notice}</p> : null}

        {session.phase === "incoming" ? (
          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={() => void calls.answer()}>
              {texts.calls.answer}
            </Button>

            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => void calls.decline()}
            >
              {texts.calls.decline}
            </Button>
          </div>
        ) : null}

        {session.phase === "calling" || session.phase === "joining" ? (
          <Button variant="outline" className="w-full rounded-full" onClick={() => void hangUp()}>
            <PhoneOff className="mr-2 h-4 w-4" />

            {call.isInitiator ? texts.calls.cancel : texts.calls.end}
          </Button>
        ) : null}

        {session.phase === "live" ? (
          <Button variant="outline" className="w-full rounded-full" onClick={() => void hangUp()}>
            <PhoneOff className="mr-2 h-4 w-4" />

            {isGroup ? texts.calls.end : texts.calls.hangUp}
          </Button>
        ) : null}

        {session.phase === "error" ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-text-muted">{session.error ?? texts.calls.loadError}</p>

            <Button variant="outline" className="rounded-full" onClick={() => calls.close()}>
              {texts.calls.end}
            </Button>
          </div>
        ) : null}

        {session.phase === "ended" || (session.phase === "live" && isTerminalState(call.state)) ? (
          <p className="text-center text-sm text-text-muted">{stateLabel(call.state)}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Aviso pequeno no canto: a chamada continua, o iframe segue montado fora da tela. */
function CallPill({ title, onExpand }: { title: string; onExpand: () => void }) {
  return (
    <button
      type="button"
      onClick={onExpand}
      className="fixed right-4 bottom-4 z-[60] flex items-center gap-2 rounded-full border border-border-soft bg-surface-1 px-4 py-2 text-sm font-medium text-text-strong shadow-xl"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
      </span>

      {title}
    </button>
  );
}

/** Reabrir pede credencial nova ao servidor: o provider reconecta ao ver "joining" sem token. */
function expandCall() {
  callSessionStore.expand();
}

/** O iframe do Jitsi: some só quando a chamada acaba, nunca vira outra aba. */
function CallFrame({ url, title, onClosed }: { url: string; title: string; onClosed: () => void }) {
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    // Se o quadro não carregar (rede/CSP), avisamos em vez de mostrar um vazio branco.
    const timer = setTimeout(() => {
      if (!loaded.current) setFailed(true);
    }, 15_000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-[240px] flex-1 bg-black">
      {failed ? (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-sm text-white/80">{texts.calls.connectionLost}</p>

          <Button variant="outline" size="sm" className="rounded-full" onClick={onClosed}>
            {texts.calls.loadError}
          </Button>
        </div>
      ) : null}

      <iframe
        src={url}
        title={title}
        // Só o necessário para a mídia: câmera e microfone; nada de abrir janelas ou sair daqui.
        allow="camera; microphone; autoplay; display-capture; fullscreen"
        allowFullScreen
        className={cn("h-full w-full border-0", failed ? "opacity-0" : "opacity-100")}
        onLoad={() => {
          loaded.current = true;
        }}
      />
    </div>
  );
}
