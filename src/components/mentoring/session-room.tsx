import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MentorRoomMode } from "@/types/application/mentor/mentor-room-mode";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  buttonVariants,
} from "@rede-enois/design-system/ui";
import { Phone, Video } from "lucide-react";

import { mentorsApi } from "@/lib/api";

/**
 * A sala da sessão é congelada no agendamento: pode ser a sala própria do mentor (Meet, Zoom) ou
 * uma do Jitsi, criada por sessão ou fixa. Só o Jitsi tem entrada por telefone — a API pública do
 * Jitsi devolve os números de discagem e o PIN da conferência.
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

      <div className="flex flex-wrap items-center gap-1">
        <a
          href={roomUrl}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className={buttonVariants({ variant: "outline", size: "sm", className: "rounded-full" })}
        >
          <Video className="mr-1 h-3.5 w-3.5" />
          {texts.mentoring.enterRoom}
        </a>

        {roomMode !== "CUSTOM" && <DialInDialog mentorId={mentorId} sessionId={sessionId} />}
      </div>
    </div>
  );
}

/** O texto que explica de onde vem a sala quando o link ainda não existe. */
export function RoomNote({ mode }: { mode: MentorRoomMode | null }) {
  if (mode === "JITSI_PERMANENT") return <>{texts.mentoring.roomPermanentNote}</>;
  if (mode === "CUSTOM") return <>{texts.mentoring.roomCustomNote}</>;
  return <>{texts.mentoring.roomPerSessionNote}</>;
}

function DialInDialog({ mentorId, sessionId }: { mentorId: string; sessionId: string }) {
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["mentor-session-dial-in", sessionId],
    queryFn: () => mentorsApi.getDialIn(mentorId, sessionId),
    enabled: open,
  });

  const numbers = data?.numbers ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="rounded-full">
          <Phone className="mr-1 h-3.5 w-3.5" />
          {texts.mentoring.dialIn}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.dialInTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-sm">
          <p className="text-xs text-text-subtle">{texts.mentoring.dialInHint}</p>

          {isLoading && <p className="text-sm text-text-subtle">{texts.common.loading}</p>}

          {!isLoading && isError && (
            <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              {texts.mentoring.dialInError}
            </p>
          )}

          {!isLoading && !isError && data && (
            <dl className="space-y-1.5 rounded-xl border border-border-soft px-3 py-2 text-xs">
              <div>
                <dt className="text-muted-foreground">{texts.mentoring.dialInConference}</dt>

                <dd className="break-all font-medium">{data.conference}</dd>
              </div>

              {data.pin && (
                <div>
                  <dt className="text-muted-foreground">{texts.mentoring.dialInPin}</dt>

                  <dd className="font-medium">{data.pin}</dd>
                </div>
              )}
            </dl>
          )}

          {!isLoading && !isError && numbers.length === 0 && (
            <p className="text-xs text-text-subtle">{texts.mentoring.dialInEmpty}</p>
          )}

          {numbers.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">{texts.mentoring.dialInNumbers}</p>

              <ul className="space-y-1">
                {numbers.map((number) => (
                  <li key={number}>
                    <a
                      href={`tel:${number.replace(/[^+\d]/g, "")}`}
                      className="text-sm text-primary underline"
                    >
                      {number}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
