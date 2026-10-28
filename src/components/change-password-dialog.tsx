import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { ChangePasswordDialogProps } from "@/types/components/account/change-password-dialog-props";
import {
  ChangePasswordDialog as ChangePasswordDialogView,
  type ChangePasswordValues,
} from "@rede-enois/design-system/domain";

import { ApiError, authApi, clearSession } from "@/lib/api";

/**
 * Troca de senha — e, para quem entrou por login social, a CRIAÇÃO da primeira.
 *
 * Quem veio do Google/LinkedIn nunca definiu senha: a conta nasce com um hash aleatório que
 * ninguém conhece. Para essas contas o diálogo não pede a senha atual (não existe), e sim cria a
 * primeira — sem isso a pessoa ficava presa: o segundo fator manda "defina uma senha" e a troca
 * pedia uma senha que nunca existiu.
 */
export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // O dado já está em cache no app (/auth/me). Sem ele (falha de rede), vale o comportamento
  // antigo: pedir a senha atual. Nunca esconder o campo de quem tem senha.
  const { data: authUser, isPending } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    enabled: open,
  });
  const hasPassword = authUser?.hasPassword ?? true;

  const submit = async (values: ChangePasswordValues) => {
    setError(null);
    setSaving(true);
    try {
      await authApi.changePassword(values);
      // O backend revoga todas as sessoes ao trocar a senha: e preciso entrar de novo.
      clearSession();
      window.location.href = "/entrar?tab=login";
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : hasPassword
            ? texts.account.changePassword.error
            : texts.account.changePassword.errorCreate,
      );
      setSaving(false);
    }
  };

  return (
    <ChangePasswordDialogView
      open={open}
      onOpenChange={onOpenChange}
      loading={isPending}
      hasPassword={hasPassword}
      onSubmit={(values) => void submit(values)}
      pending={saving}
      error={error}
      onReset={() => {
        setError(null);
        setSaving(false);
      }}
    />
  );
}
