import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { BlockUserDialogProps } from "@/types/components/profile/block-user-dialog-props";
import { Loader2, ShieldOff, Undo2 } from "lucide-react";

import { networkApi } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/**
 * Bloquear esconde a pessoa de tudo (feed, comentários, notificações, busca) e vale para sempre —
 * por isso a confirmação explica o que acontece antes de aplicar.
 */
export function BlockUserDialog({ userId, name, blocked, onDone }: BlockUserDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);

  const block = useMutation({
    mutationFn: () => networkApi.block(userId),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setOpen(false);
      onDone?.();
    },
    onError: () => setError(true),
  });

  const unblock = useMutation({
    mutationFn: () => networkApi.unblock(userId),
    onSuccess: () => {
      queryClient.invalidateQueries();
      setOpen(false);
      onDone?.();
    },
    onError: () => setError(true),
  });

  const pending = block.isPending || unblock.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(false);
        setOpen(next);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full gap-1.5 text-destructive hover:text-destructive"
        >
          {blocked ? <Undo2 className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}

          <>{blocked ? texts.profile.unblockUser : texts.profile.blockUser}</>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">
            {blocked ? texts.profile.unblockTitle(name) : texts.profile.blockTitle(name)}
          </DialogTitle>

          <DialogDescription>
            {blocked ? texts.profile.unblockDescription : texts.profile.blockDescription}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {texts.profile.blockError}
          </p>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            className="rounded-full"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            {texts.common.cancel}
          </Button>

          <Button
            className="rounded-full gap-2"
            variant={blocked ? "outline" : "destructive"}
            disabled={pending}
            onClick={() => {
              setError(false);
              if (blocked) unblock.mutate();
              else block.mutate();
            }}
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}

            {blocked ? texts.profile.unblockUser : texts.profile.blockUser}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
