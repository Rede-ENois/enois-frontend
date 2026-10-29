import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { PresenceStatus } from "@/types/application/presence/presence-status";
import type { PublicPresenceStatus } from "@/types/application/presence/public-presence-status";
import type { PresenceIndicatorProps } from "@/types/components/presence/presence-indicator-props";
import { Popover, PopoverContent, PopoverTrigger } from "@rede-enois/design-system/ui";

import { presenceApi } from "@/lib/api/presence";
import { cn } from "@/lib/utils";

const OPTIONS: PresenceStatus[] = ["AVAILABLE", "AWAY", "DO_NOT_DISTURB", "INVISIBLE"];

const DOT_COLORS: Record<PresenceStatus | PublicPresenceStatus, string> = {
  AVAILABLE: "bg-emerald-500",
  AWAY: "bg-amber-400",
  DO_NOT_DISTURB: "bg-rose-500",
  INVISIBLE: "bg-slate-400",
  OFFLINE: "bg-slate-400",
};

export function PresenceIndicator({ username, isOwn }: PresenceIndicatorProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const presence = useQuery<{ status: PresenceStatus | PublicPresenceStatus }>({
    queryKey: isOwn ? ["presence", "me"] : ["presence", "public", username],
    queryFn: isOwn ? presenceApi.own : () => presenceApi.byUsername(username),
    retry: false,
    staleTime: 45_000,
    refetchInterval: 60_000,
  });
  const update = useMutation({
    mutationFn: (status: PresenceStatus) => presenceApi.set(status),
    onSuccess: (result) => {
      queryClient.setQueryData(["presence", "me"], result);
      void queryClient.invalidateQueries({ queryKey: ["presence", "public", username] });
      setOpen(false);
    },
  });
  const status = presence.data?.status;

  if (!status) {
    if (!presence.isError) return null;
    return (
      <span
        className="inline-flex h-6 w-6 shrink-0 items-center justify-center"
        title={texts.presence.unavailable}
        aria-label={texts.presence.unavailable}
      >
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-slate-400" />
      </span>
    );
  }

  const label =
    isOwn && status !== "OFFLINE"
      ? texts.presence.options[status].label
      : texts.presence.publicStatus[status];
  const dot = (
    <span aria-hidden className={cn("block h-2.5 w-2.5 rounded-full", DOT_COLORS[status])} />
  );

  if (!isOwn) {
    return (
      <span className="inline-flex shrink-0 items-center" title={label} aria-label={label}>
        {dot}
      </span>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`${texts.presence.change}: ${label}`}
          title={`${texts.presence.change}: ${label}`}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-primary"
        >
          {dot}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[min(17rem,calc(100vw-2rem))] rounded-xl border-border-soft bg-surface-card p-2 shadow-card"
      >
        <p className="px-2 pb-1 text-xs font-medium text-text-subtle">{texts.presence.title}</p>

        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={status === option}
            disabled={update.isPending}
            onClick={() => update.mutate(option)}
            className={cn(
              "flex w-full items-start gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-surface-2 disabled:opacity-50",
              status === option && "bg-surface-2",
            )}
          >
            <span
              aria-hidden
              className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", DOT_COLORS[option])}
            />

            <span>
              <span className="block text-sm font-medium text-text-strong">
                {texts.presence.options[option].label}
              </span>

              <span className="block text-xs text-text-subtle">
                {texts.presence.options[option].hint}
              </span>
            </span>
          </button>
        ))}

        {update.isError && (
          <p role="alert" className="px-2 pt-1 text-xs text-destructive">
            {texts.presence.updateError}
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}
