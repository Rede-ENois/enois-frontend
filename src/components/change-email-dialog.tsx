import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ChangeEmailDialogProps } from "@/types/components/account/change-email-dialog-props";
import {
  ChangeEmailDialog as ChangeEmailDialogView,
  type ChangeEmailValues,
} from "@rede-enois/design-system/domain";

import { ApiError, authApi } from "@/lib/api";

export function ChangeEmailDialog({ open, onOpenChange, currentEmail }: ChangeEmailDialogProps) {
  const queryClient = useQueryClient();

  const change = useMutation({
    mutationFn: ({ email, password }: ChangeEmailValues) =>
      authApi.changeEmail({ email: email.trim(), password }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });

  return (
    <ChangeEmailDialogView
      open={open}
      onOpenChange={onOpenChange}
      currentEmail={currentEmail}
      onSubmit={(values) => change.mutate(values)}
      pending={change.isPending}
      error={
        change.error
          ? change.error instanceof ApiError
            ? change.error.message
            : texts.account.changeEmail.error
          : null
      }
      done={change.isSuccess}
      onReset={() => change.reset()}
    />
  );
}
