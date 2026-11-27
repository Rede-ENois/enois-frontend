import { useState } from "react";

import { useMutation } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Button, ConfirmDialog, Input, useToast } from "@rede-enois/design-system/ui";

import { ApiError, moderationApi } from "@/lib/api";

/**
 * "Adicionar tag de apoiador" no painel administrativo do perfil.
 *
 * Existe para o caso em que a pessoa doou e o sistema não reconheceu o comprovante: o dinheiro
 * chegou, e o selo não podia ficar dependendo da leitura. O backend é a régua — exige motivo, aceita
 * um selo por conta e recusa quem já é apoiador por doação confirmada; esta tela só repete o que ele
 * respondeu.
 *
 * O componente é do app (e não do design system) porque a seção do perfil no DS instalado não tem
 * onde encaixar um botão a mais; fica acima dela, no mesmo bloco "Ações administrativas".
 */
export function AdminSupporterSealButton({ username }: { username: string }) {
  const { toast } = useToast();
  const copy = texts.platformAdmin.seal;
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clean = reason.trim();

  const grant = useMutation({
    mutationFn: () => moderationApi.adminGrantSupporterSeal(username, clean),
    onSuccess: () => {
      setError(null);
      toast(copy.done, "success");
      setDone(true);
      // "Já registrado" não é erro para a tela: o selo está lá, e repetir o clique não muda nada.
      setOpen(false);
      setReason("");
    },
    onError: (failure: Error) => {
      setError(failure instanceof ApiError ? failure.message : copy.error);
    },
  });

  const confirm = () => {
    if (clean.length < 10) return;
    grant.mutate();
  };

  return (
    <div className="space-y-2 surface-card p-4">
      <p className="text-sm text-text-subtle">{copy.hint}</p>
      <Input
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        placeholder={copy.placeholder}
        maxLength={2000}
        aria-label={copy.placeholder}
        disabled={done}
      />
      {clean.length > 0 && clean.length < 10 && (
        <p className="text-xs text-text-subtle">{copy.tooShort}</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="w-auto rounded-full gap-1.5"
          disabled={clean.length < 10 || grant.isPending || done}
          onClick={() => {
            setError(null);
            setOpen(true);
          }}
        >
          💜 {done ? copy.buttonDone : copy.button}
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={copy.title}
        description={copy.description(`@${username}`)}
        confirmLabel={copy.confirm}
        cancelLabel={texts.common.cancel}
        pending={grant.isPending}
        onConfirm={confirm}
      />
    </div>
  );
}
