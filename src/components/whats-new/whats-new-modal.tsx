import { useNavigate } from "@tanstack/react-router";

import type { WhatsNewModalProps } from "@/types/components/whats-new/whats-new-modal-props";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Switch,
} from "@rede-enois/design-system/ui";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export function WhatsNewModal({
  open,
  onOpenChange,
  release,
  whatsNewEnabled = true,
  onToggleWhatsNewEnabled,
}: WhatsNewModalProps) {
  const navigate = useNavigate();

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleAction = (to: string) => {
    onOpenChange(false);
    void navigate({ to });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-hidden p-0 sm:max-w-xl">
        <div className="flex max-h-[90vh] flex-col">
          {/* Header com destaque de versão */}
          <DialogHeader className="border-b border-border-soft px-6 pt-6 pb-4 text-left">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 text-primary">
                <Sparkles className="h-4 w-4" />
              </span>

              <p className="text-xs font-semibold tracking-wider text-primary uppercase">
                Novidades da Plataforma
              </p>

              <span className="rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-text-subtle">
                {release.version}
              </span>
            </div>

            <DialogTitle className="mt-2 text-xl font-bold text-text-strong">
              {release.title}
            </DialogTitle>

            <DialogDescription className="text-sm text-text-subtle">
              {release.description}
            </DialogDescription>
          </DialogHeader>

          {/* Lista rolável de novidades */}
          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            {release.items.map((item, index) => (
              <div
                key={item.id}
                className="rounded-2xl border border-border-soft bg-surface-card p-4 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary"
                    >
                      {index + 1}
                    </span>

                    <h3 className="text-base font-semibold text-text-strong">{item.title}</h3>
                  </div>

                  {item.tag && (
                    <span className="shrink-0 rounded-full border border-border-soft px-2 py-0.5 text-[11px] font-medium text-text-subtle">
                      {item.tag}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-sm text-text-subtle">{item.description}</p>

                {/* Passos de como usar */}
                {item.steps && item.steps.length > 0 && (
                  <div className="mt-3 rounded-xl bg-surface-2/60 p-3">
                    <p className="text-xs font-semibold text-text-strong">Como usar:</p>

                    <ol className="mt-1.5 space-y-1.5">
                      {item.steps.map((step, stepIndex) => (
                        <li
                          key={stepIndex}
                          className="flex items-start gap-2 text-xs text-text-subtle"
                        >
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />

                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Botão Experimentar */}
                {item.action && (
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 rounded-full text-xs font-medium"
                      onClick={() => handleAction(item.action!.to)}
                    >
                      <span>{item.action.label}</span>

                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Rodapé com controle de desativação e confirmação */}
          <DialogFooter className="flex-col gap-3 border-t border-border-soft bg-surface-1 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            {onToggleWhatsNewEnabled && (
              <label className="flex cursor-pointer items-center gap-2">
                <Switch
                  checked={whatsNewEnabled}
                  onCheckedChange={onToggleWhatsNewEnabled}
                  className="scale-90"
                />

                <span className="text-xs text-text-subtle">
                  Avisar sobre novas atualizações automaticamente
                </span>
              </label>
            )}

            <Button className="w-full rounded-full sm:w-auto" onClick={handleClose}>
              Entendi, vamos lá!
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
