import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  useToast,
} from "@rede-enois/design-system/ui";
import { Copy, Video } from "lucide-react";

import { mentorsApi } from "@/lib/api";

/**
 * Painel do mentor com a sala que as próximas sessões usam. O link permanente do Jitsi não vai
 * para a vitrine (não tem sala de espera: quem tem o link entra), então ele só aparece aqui.
 */
export function MentorRoomDialog({ mentorId }: { mentorId: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mentor-room", mentorId],
    queryFn: () => mentorsApi.getRoom(mentorId),
    enabled: open,
  });

  const roomUrl = data?.roomUrl ?? null;
  const modeLabel =
    data?.roomMode === "JITSI_PERMANENT"
      ? texts.mentoring.roomModePermanent
      : data?.roomMode === "CUSTOM"
        ? texts.mentoring.roomModeCustom
        : texts.mentoring.roomModeSession;

  const copy = async () => {
    if (!roomUrl) return;
    try {
      await navigator.clipboard.writeText(roomUrl);
      toast(texts.mentoring.permanentRoomCopied, "success");
    } catch {
      // Sem permissão de área de transferência o link continua visível na tela.
      toast(texts.mentoring.permanentRoomError, "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 self-center rounded-lg px-[14px] py-2">
          <Video className="mr-1.5 h-4 w-4" />
          {texts.mentoring.permanentRoomTitle}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.permanentRoomTitle}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-2 text-sm">
          {isLoading && <p className="text-sm text-text-subtle">{texts.common.loading}</p>}

          {!isLoading && isError && (
            <div className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
              <p>{texts.mentoring.permanentRoomError}</p>

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

          {!isLoading && !isError && data && (
            <>
              <p className="text-xs text-text-subtle">{modeLabel}</p>

              {roomUrl ? (
                <div className="space-y-1.5">
                  <a
                    href={roomUrl}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="block break-all text-sm text-primary underline"
                  >
                    {roomUrl}
                  </a>

                  <p className="text-xs text-text-subtle">{texts.mentoring.permanentRoomHint}</p>

                  <Button variant="outline" size="sm" className="rounded-full" onClick={copy}>
                    <Copy className="mr-1 h-3.5 w-3.5" />
                    {texts.mentoring.permanentRoomCopy}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-text-subtle">{texts.mentoring.roomPerSessionNote}</p>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
