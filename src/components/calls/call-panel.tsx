import { type RefObject, useEffect, useRef, useState } from "react";

import { texts } from "@/texts";
import { callEmbedUrl } from "@/types/application/call/call-embed-url";
import type { CallView } from "@/types/application/call/call-view";
import { isTerminalState } from "@/types/application/call/is-terminal-state";
import { Button } from "@rede-enois/design-system/ui";
import { Flag, Minimize2, PhoneOff } from "lucide-react";

import { subscribeToRoomExit } from "@/lib/calls/call-room-bridge";
import { callSessionStore, useCallSession } from "@/lib/calls/call-session";
import { useHangUp } from "@/lib/calls/use-hang-up";
import { useFocusTrap } from "@/lib/use-focus-trap";
import { cn } from "@/lib/utils";

import { CallIncomingScreen } from "./call-incoming-screen";
import { CallReportDialog } from "./call-report-dialog";
import { stateLabel, useCalls } from "./calls-provider";

/**
 * Painel da chamada: overlay interno (não abre aba), com o Jitsi embutido.
 *
 * A mídia (microfone, câmera, sair, participantes) fica na barra do próprio Jitsi — é a interface
 * dele, chamando o participante pelo nome da conta. Aqui ficam as ações que o app precisa
 * controlar: minimizar (sem largar a sala), encerrar/sair e atender/recusar.
 *
 * A chamada recebida ocupa a tela inteira, como um discador: tocar no canto não é aviso suficiente
 * para uma ligação, e o "Atender" precisa estar onde a pessoa olha. A chamada ao vivo também abre
 * em tela cheia e pode ser minimizada para o canto — o iframe continua montado, só sai da frente.
 */
export function CallPanel() {
  const session = useCallSession();
  const calls = useCalls();
  const hangUp = useHangUp();
  const call = session.call;
  // A sala é de outro domínio: a captura da denúncia é pedida a ela por postMessage.
  const frameRef = useRef<HTMLIFrameElement | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  // Recebida e ao vivo ocupam a tela inteira, como um discador: tocar no canto não é aviso
  // suficiente para uma ligação. Antes de entrar (chamando/conectando) e nos avisos, a moldura
  // menor — não há mídia para ocupar a tela ainda.
  const fullscreen =
    (session.phase === "live" && !session.minimized) || session.phase === "incoming";
  // Em tela cheia o painel é modal (`aria-modal`): o Tab não pode escapar para a página de trás.
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useFocusTrap(dialogRef, fullscreen && !reportOpen);

  // Aviso de ambiente ainda em configuração: não é uma chamada, então não tem moldura de chamada.
  if (session.phase === "error" && session.notConfigured) {
    return (
      <div
        className={cn(
          "fixed z-[60] flex flex-col gap-3 overflow-hidden rounded-2xl border border-border-soft bg-surface-1 p-4 shadow-2xl",
          "inset-x-2 bottom-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[340px]",
        )}
        role="alertdialog"
        aria-live="assertive"
      >
        <p className="text-sm font-semibold text-text-strong">{texts.calls.notConfiguredTitle}</p>

        <p className="text-sm text-text-muted">{session.error ?? texts.calls.notConfigured}</p>

        <Button
          variant="outline"
          className="w-full rounded-full"
          onClick={() => calls.close()}
          autoFocus
        >
          {texts.calls.dismissNotice}
        </Button>
      </div>
    );
  }

  if (!call) return null;

  const title = call.kind === "VIDEO" ? texts.calls.videoTitle : texts.calls.audioTitle;
  const isGroup = call.modality === "GROUP";
  const held = session.waiting[0] ?? null;

  if (session.minimized && session.phase === "live") {
    return <CallPill title={isGroup ? texts.calls.tamoJunto : title} onExpand={expandCall} />;
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className={cn(
        // `dvh` e não `inset-0` no celular: com `inset-0` a altura é a do viewport de layout, que
        // fica atrás da barra do navegador — os botões de encerrar e denunciar terminam embaixo
        // dela. `dvh` acompanha a barra, e a folga de baixo respeita a área segura do aparelho.
        "fixed z-[60] flex flex-col overflow-hidden border-border-soft bg-surface-1 shadow-2xl focus:outline-none",
        fullscreen
          ? "inset-x-0 top-0 h-[100dvh] justify-center rounded-none border-0 sm:inset-3 sm:h-auto sm:rounded-2xl sm:border"
          : "inset-x-2 bottom-2 max-h-[85dvh] rounded-2xl border sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px]",
      )}
      role="dialog"
      aria-label={title}
      aria-modal={fullscreen}
    >
      {session.phase === "incoming" ? (
        <CallIncomingScreen
          call={call}
          held={held}
          onAnswer={() => void calls.answer()}
          onDecline={() => void calls.decline()}
          onAnswerHeld={held ? () => void calls.answer(held.id) : undefined}
          onDeclineHeld={held ? () => void calls.decline(held.id) : undefined}
        />
      ) : (
        <>
          <header className="flex items-center justify-between gap-2 border-b border-border-soft px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-strong">
                {isGroup ? `${texts.calls.tamoJunto} · ${call.displayName}` : call.displayName}
              </p>

              <p className="text-xs text-text-muted" aria-live="polite">
                {/* Enquanto a credencial não chega, quem clicou em entrar ainda está entrando: dizer
                "em andamento · N pessoas" aí mostra a sala para quem não está nela. */}
                {session.phase === "joining" ? texts.calls.connecting : stateLabel(call.state)}
                {session.phase !== "joining" && call.state === "ACTIVE" && call.participantCount > 0
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
              frameRef={frameRef}
              url={callEmbedUrl(session.join)}
              title={title}
              onClosed={() => callSessionStore.lostCredential()}
              // A pessoa desligou dentro da sala: fecha o painel e avisa o servidor. Não é
              // "credencial perdida" — reconectar ali reabriria a chamada que ela encerrou.
              onLeft={(reason) => void calls.leaveFromRoom(session.join!.callId, reason)}
            />
          ) : null}

          <div className="flex flex-col gap-2 px-4 py-3">
            {session.notice ? <p className="text-xs text-text-muted">{session.notice}</p> : null}

            {held ? (
              <p className="truncate text-xs text-text-muted" aria-live="polite">
                {texts.calls.nextInQueue(held.displayName)}
              </p>
            ) : null}

            {session.phase === "calling" || session.phase === "joining" ? (
              <Button
                variant="outline"
                className="w-full rounded-full"
                onClick={() => void hangUp()}
              >
                <PhoneOff className="mr-2 h-4 w-4" />

                {call.isInitiator ? texts.calls.cancel : texts.calls.end}
              </Button>
            ) : null}

            {session.phase === "live" ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => setReportOpen(true)}
                >
                  <Flag className="mr-2 h-4 w-4" />

                  {texts.calls.report.action}
                </Button>

                <Button
                  variant="outline"
                  className="flex-1 rounded-full"
                  onClick={() => void hangUp()}
                >
                  <PhoneOff className="mr-2 h-4 w-4" />

                  {isGroup ? texts.calls.end : texts.calls.hangUp}
                </Button>
              </div>
            ) : null}

            {session.phase === "error" ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-text-muted">{session.error ?? texts.calls.loadError}</p>

                <Button variant="outline" className="rounded-full" onClick={() => calls.close()}>
                  {texts.calls.end}
                </Button>
              </div>
            ) : null}

            {session.phase === "ended" ||
            (session.phase === "live" && isTerminalState(call.state)) ? (
              <p className="text-center text-sm text-text-muted">{stateLabel(call.state)}</p>
            ) : null}
          </div>

          {session.phase === "live" ? (
            <CallReportDialog
              callId={call.id}
              frameRef={frameRef}
              open={reportOpen}
              onOpenChange={setReportOpen}
            />
          ) : null}
        </>
      )}
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
function CallFrame({
  url,
  title,
  frameRef,
  onClosed,
  onLeft,
}: {
  url: string;
  title: string;
  frameRef: RefObject<HTMLIFrameElement | null>;
  onClosed: () => void;
  /** A sala avisou que a pessoa saiu dela (desligou na barra do próprio Epapo). */
  onLeft: (reason: string | undefined) => void;
}) {
  const [failed, setFailed] = useState(false);
  const loaded = useRef(false);

  useEffect(() => {
    // Se o quadro não carregar (rede/CSP), avisamos em vez de mostrar um vazio branco.
    const timer = setTimeout(() => {
      if (!loaded.current) setFailed(true);
    }, 15_000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // A sala é de outro domínio e só se comunica por postMessage: é o aviso de saída que faz o
    // painel fechar quando a pessoa desliga por dentro dela.
    return subscribeToRoomExit(frameRef.current, (message) => onLeft(message.reason));
    // A iframe é remontada a cada credencial (`key` no `<iframe>`), então o aviso é religado com
    // a janela nova. O `ref` em si é estável, então listá-lo não refaz a escuta à toa.
  }, [url, onLeft, frameRef]);

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
        ref={frameRef}
        src={url}
        title={title}
        // Só o necessário para a mídia: câmera e microfone; nada de abrir janelas ou sair daqui.
        // Este `allow` só repassa o que a página já libera: quem autoriza o domínio da sala é o
        // `Permissions-Policy` (ver `permissionsPolicy` em `lib/csp.ts`).
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
