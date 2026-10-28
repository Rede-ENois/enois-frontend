import { useState } from "react";

import { texts } from "@/texts";
import type { DeleteAccountDialogProps } from "@/types/components/account/delete-account-dialog-props";
import { DeleteAccountDialog as DeleteAccountDialogView } from "@rede-enois/design-system/domain";

import { ApiError, authApi, clearSession } from "@/lib/api";

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const submit = async (password: string) => {
    setError(null);
    setDeleting(true);
    try {
      await authApi.deleteAccount({ password });
      clearSession();
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : texts.account.deleteAccount.error);
      setDeleting(false);
    }
  };

  return (
    <DeleteAccountDialogView
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={(password) => void submit(password)}
      pending={deleting}
      error={error}
      onReset={() => {
        setError(null);
        setDeleting(false);
      }}
    />
  );
}
