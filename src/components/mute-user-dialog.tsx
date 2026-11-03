import { type KeyboardEvent, useRef, useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { MuteDuration } from "@/types/application/network/mute-duration";
import type { MuteUserDialogProps } from "@/types/components/profile/mute-user-dialog-props";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rede-enois/design-system/ui";
import { BellOff, Loader2, Undo2 } from "lucide-react";

import { networkApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Os prazos que a issue pede, na ordem em que aparecem no menu. */
const DURATIONS: MuteDuration[] = ["24h", "72h", "7d", "forever"];

/**
 * Silenciar esconde a pessoa SEM que ela saiba e SEM desfazer a conexão — diferente de bloquear.
 * Com prazo, o silenciamento vence sozinho e o conteúdo dela volta ao feed.
 */
export function MuteUserDialog({ userId, name, muted, expiresAt, onDone }: MuteUserDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [duration, setDuration] = useState<MuteDuration>("24h");
  const options = useRef<(HTMLButtonElement | null)[]>([]);

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-status", userId] });
    queryClient.invalidateQueries({ queryKey: ["muted-users"] });
    setOpen(false);
    onDone?.();
  };

  /** Padrão WAI-ARIA de radiogroup: um item no tab order e as setas andam entre as opções. */
  const choose = (index: number) => {
    const next = (index + DURATIONS.length) % DURATIONS.length;
    setDuration(DURATIONS[next]);
    options.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (step === undefined) return;
    event.preventDefault();
    choose(index + step);
  };

  const mute = useMutation({
    mutationFn: () => networkApi.mute(userId, duration),
    onSuccess: done,
    onError: () => setError(true),
  });

  const unmute = useMutation({
    mutationFn: () => networkApi.unmute(userId),
    onSuccess: done,
    onError: () => setError(true),
  });

  const pending = mute.isPending || unmute.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(false);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          {muted ? <Undo2 className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}

          <>{muted ? texts.profile.unmute : texts.profile.mute}</>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">
            {muted ? texts.profile.unmuteTitle(name) : texts.profile.muteTitle(name)}
          </DialogTitle>

          <DialogDescription>
            {muted
              ? texts.profile.muteActiveDescription(expiresAt ?? null)
              : texts.profile.muteDescription}
          </DialogDescription>
        </DialogHeader>

        {!muted && (
          <div
            className="grid grid-cols-2 gap-2"
            role="radiogroup"
            aria-label={texts.profile.muteDurationLabel}
          >
            {DURATIONS.map((value, index) => (
              <button
                key={value}
                ref={(element) => {
                  options.current[index] = element;
                }}
                type="button"
                role="radio"
                aria-checked={duration === value}
                tabIndex={duration === value ? 0 : -1}
                disabled={pending}
                onClick={() => setDuration(value)}
                onKeyDown={(event) => onKeyDown(event, index)}
                className={cn(
                  "rounded-full border px-3 py-2 text-sm font-normal transition-colors",
                  duration === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border-soft text-text-subtle hover:bg-muted",
                )}
              >
                {texts.profile.muteDurations[value]}
              </button>
            ))}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {texts.profile.muteError}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            <>{texts.common.cancel}</>
          </Button>

          <Button
            className="rounded-full gap-2"
            disabled={pending}
            onClick={() => {
              setError(false);
              if (muted) unmute.mutate();
              else mute.mutate();
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}

            <>{muted ? texts.profile.unmute : texts.profile.mute}</>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
