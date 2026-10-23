import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { OctagonAlert, Power } from "lucide-react";

import { moderationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

/**
 * Botão de pânico: bloqueia TODA escrita da aplicação com 429 enquanto estiver ativo. O próprio
 * botão (e o login) ficam fora do bloqueio, senão não haveria como desligar. O estado é
 * compartilhado entre os pods pelo backend.
 */
export function PanicModeSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const status = useQuery({
    queryKey: ["moderation", "panic"],
    queryFn: () => moderationApi.panicStatus(),
    refetchInterval: 5_000,
  });

  const toggle = useMutation({
    mutationFn: (active: boolean) => moderationApi.setPanic(active),
    onSuccess: (result) => {
      queryClient.setQueryData(["moderation", "panic"], result);
      toast(texts.moderator.panic.done(result.active), "success");
    },
    onError: () => toast(texts.moderator.panic.error, "error"),
  });

  const active = status.data?.active ?? false;
  const envLocked = status.data?.envLocked ?? false;

  return (
    <section
      className={cn(
        "space-y-2 rounded-2xl border p-4",
        active ? "border-destructive/60 bg-destructive/10" : "border-border-soft bg-surface-card",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 text-base font-medium">
            <OctagonAlert className={cn("h-5 w-5", active ? "text-destructive" : "text-primary")} />

            <>{texts.moderator.panic.title}</>
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            {envLocked
              ? texts.moderator.panic.envLocked
              : active
                ? texts.moderator.panic.active
                : texts.moderator.panic.description}
          </p>
        </div>

        <Button
          variant={active ? "outline" : "destructive"}
          className="w-auto rounded-full gap-2"
          disabled={toggle.isPending || status.isLoading || envLocked}
          onClick={() => (active ? toggle.mutate(false) : setConfirmOpen(true))}
        >
          <Power className="h-4 w-4" />

          <>{active ? texts.moderator.panic.deactivate : texts.moderator.panic.activate}</>
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={texts.moderator.panic.confirmTitle}
        description={texts.moderator.panic.confirmBody}
        confirmLabel={texts.moderator.panic.activate}
        destructive
        pending={toggle.isPending}
        onConfirm={() => {
          setConfirmOpen(false);
          toggle.mutate(true);
        }}
      />
    </section>
  );
}
