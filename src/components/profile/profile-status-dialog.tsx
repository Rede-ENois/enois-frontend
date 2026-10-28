import { useEffect, useId, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { ProfileStatus } from "@/types/application/profile/profile-status";
import type { ProfileStatusDialogProps } from "@/types/components/profile/profile-status-dialog-props";
import { CosmeticIcon } from "@rede-enois/design-system/domain";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  useToast,
} from "@rede-enois/design-system/ui";
import { Ban } from "lucide-react";

import { lojaApi } from "@/lib/api";
import { MAX_STATUS_CHARS, cosmeticErrorMessage, statusIconChoices } from "@/lib/cosmetics";
import { cn } from "@/lib/utils";

const ICON_BUTTON =
  "grid h-10 w-10 place-items-center rounded-full border border-border-soft bg-surface-1 transition hover:border-primary/50 aria-pressed:border-primary aria-pressed:ring-2 aria-pressed:ring-primary/40";

/** The owner's status bubble: short text plus a free icon or the icon of an owned badge. */
export function ProfileStatusDialog({
  open,
  onOpenChange,
  username,
  statusText,
  statusIcon,
}: ProfileStatusDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const textId = useId();
  const [text, setText] = useState("");
  const [icon, setIcon] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setText(statusText ?? "");
    setIcon(statusIcon ?? null);
  }, [open, statusText, statusIcon]);

  // Owned official badges unlock their icon; the same catalog query as the shop.
  const catalog = useQuery({
    queryKey: ["loja", "oldest"],
    queryFn: () => lojaApi.catalog(),
    enabled: open,
  });
  const choices = statusIconChoices(catalog.data);

  const save = useMutation({
    mutationFn: () => lojaApi.setStatus(text.trim(), icon),
    onSuccess: (status: ProfileStatus) => {
      queryClient.setQueryData<Profile>(["profile", username], (current) =>
        current ? { ...current, ...status } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ["profile", username] });
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast(texts.cosmetics.status.saved, "success");
      onOpenChange(false);
    },
    onError: (error) => toast(cosmeticErrorMessage(error), "error"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.cosmetics.status.title}</DialogTitle>

          <DialogDescription>{texts.cosmetics.status.description}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4 pt-2"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor={textId}>{texts.cosmetics.status.textLabel}</Label>

            <Input
              id={textId}
              value={text}
              maxLength={MAX_STATUS_CHARS}
              placeholder={texts.cosmetics.status.placeholder}
              onChange={(event) => setText(event.target.value)}
            />
          </div>

          <fieldset className="space-y-1.5">
            <legend className="text-sm font-medium text-text-strong">
              {texts.cosmetics.status.iconLabel}
            </legend>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={cn(ICON_BUTTON, "text-xs text-text-subtle")}
                aria-pressed={icon === null}
                title={texts.cosmetics.status.noIcon}
                aria-label={texts.cosmetics.status.noIcon}
                onClick={() => setIcon(null)}
              >
                <Ban className="h-4 w-4" aria-hidden />
              </button>
              {choices.map((choice) => (
                <button
                  key={choice.icon}
                  type="button"
                  className={ICON_BUTTON}
                  aria-pressed={icon === choice.icon}
                  title={choice.label}
                  aria-label={choice.label}
                  onClick={() => setIcon(choice.icon)}
                >
                  <CosmeticIcon icon={choice.icon} className="h-6 w-6" />
                </button>
              ))}
            </div>
          </fieldset>

          <Button type="submit" size="sm" className="w-full rounded-full" disabled={save.isPending}>
            {save.isPending ? texts.common.saving : texts.common.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
