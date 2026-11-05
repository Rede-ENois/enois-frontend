import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MentorRoomMode } from "@/types/application/mentor/mentor-room-mode";
import { sessionEmbedUrl } from "@/types/application/mentor/session-embed-url";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  buttonVariants,
} from "@rede-enois/design-system/ui";
import { Video } from "lucide-react";

import { mentorsApi } from "@/lib/api";

/**
 * A sala da sessão é congelada no agendamento: pode ser a sala própria do mentor (Meet, Zoom) ou
 * uma do Epapo, criada por sessão ou fixa.
 *
 * Sala do Epapo abre embutida, nunca em outra aba, e o token de entrada é pedido ao servidor na
 * hora — o navegador nunca recebe o segredo de assinatura. Sala própria é um link externo: o
 * mentor é dono dela e o app não tem como autorizar a entrada.
 */
export function SessionRoom({
  mentorId,
  sessionId,
  roomUrl,
  roomMode,
}: {
  mentorId: string;
  sessionId: string;
  roomUrl: string | null;
  roomMode: MentorRoomMode | null;
}) {
  if (!roomUrl) {
    return (
      <span className="text-xs text-text-subtle">
        <RoomNote mode={roomMode} />
      </span>
    );
  }

  if (roomMode === "CUSTOM") {
    return (
      <div className="space-y-1.5">
        <a
          href={roomUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="block break-all text-xs text-primary underline"
        >
          {roomUrl}
        </a>

        <a
          href={roomUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
        >
          <Video className="mr-1 h-3.5 w-3.5" />
          {texts.mentoring.enterRoom}
        </a>
      </div>
    );
  }

  return <EpapoRoomDialog mentorId={mentorId} sessionId={sessionId} />;
}

/** O texto que explica de onde vem a sala quando o link ainda não existe. */
export function RoomNote({ mode }: { mode: MentorRoomMode | null }) {
  if (mode === "EPAPO_PERMANENT") return <>{texts.mentoring.roomPermanentNote}</>;
  if (mode === "CUSTOM") return <>{texts.mentoring.roomCustomNote}</>;
  return <>{texts.mentoring.roomPerSessionNote}</>;
}

/**
 * Sala do Epapo embutida. O token é pedido ao abrir e vale por pouco tempo; fechar o diálogo
 * desmonta o quadro, então reabrir pede credencial nova em vez de reaproveitar uma vencida.
 */
function EpapoRoomDialog({ mentorId, sessionId }: { mentorId: string; sessionId: string }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor-session-access", sessionId],
    queryFn: () => mentorsApi.joinSession(mentorId, sessionId),
    enabled: open,
    // O token vence: não guardar credencial de sala em cache entre aberturas.
    gcTime: 0,
    staleTime: 0,
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full">
          <Video className="mr-1 h-3.5 w-3.5" />
          {texts.mentoring.enterRoom}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.roomDialogTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {isLoading && <p className="text-sm text-text-subtle">{texts.mentoring.roomOpening}</p>}

          {!isLoading && isError && (
            <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <p>{texts.mentoring.roomOpenError}</p>

              <Button
                variant="outline"
                size="sm"
                className="mt-2 rounded-full"
                onClick={() => refetch()}
              >
                {texts.mentoring.retry}
              </Button>
            </div>
          )}

          {!isLoading && !isError && data?.roomUrl && (
            <iframe
              key={data.jwt ?? data.roomUrl}
              src={sessionEmbedUrl(data)}
              title={texts.mentoring.roomDialogTitle}
              // Só o necessário para a mídia: câmera e microfone; nada de abrir janelas.
              allow="camera; microphone; autoplay; display-capture; fullscreen"
              allowFullScreen
              className="h-[60vh] w-full rounded-xl border border-border-soft bg-black"
            />
          )}

          <p className="text-xs text-text-subtle">{texts.mentoring.roomPrivacyNote}</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
