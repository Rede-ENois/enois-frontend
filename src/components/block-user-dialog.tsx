import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { BlockUserDialogProps } from "@/types/components/profile/block-user-dialog-props";
import { BlockUserDialog as BlockUserDialogView } from "@rede-enois/design-system/domain";

import { networkApi } from "@/lib/api";

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

  return (
    <BlockUserDialogView
      name={name}
      blocked={blocked}
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(false);
        setOpen(next);
      }}
      onCancel={() => setOpen(false)}
      pending={block.isPending || unblock.isPending}
      error={error}
      onConfirm={() => {
        setError(false);
        if (blocked) unblock.mutate();
        else block.mutate();
      }}
    />
  );
}
