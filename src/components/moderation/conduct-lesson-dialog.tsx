import type { ConductLessonDialogProps } from "@/types/components/moderation/conduct-lesson-dialog-props";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@rede-enois/design-system/ui";
import { CheckCircle2, GraduationCap, ShieldAlert, Sparkles } from "lucide-react";

/**
 * Modal educativo estilo "Sala do Professor / Aula de Bons Modos":
 * Exibido quando um usuário tenta fazer upload de conteúdo impróprio ou pornográfico.
 * Repreende com bom humor e didática, com design compacto (SEM SCROLL) adaptado a qualquer tela.
 */
export function ConductLessonDialog({ open, onOpenChange }: ConductLessonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border-soft p-0 max-w-[calc(100vw-2rem)] sm:max-w-lg">
        {/* Banner de Topo Compacto */}
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-primary/10 to-destructive/15 px-4 py-3 sm:px-5 sm:py-4">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-amber-500/20 blur-xl" />

          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-surface-card/90 shadow-xs backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-amber-500 dark:text-amber-400" />
              <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-spin text-primary" />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-2.5 w-2.5" />
                Advertência no Boletim
              </span>

              <DialogHeader className="mt-0.5 space-y-0 text-left">
                <DialogTitle className="text-sm font-bold tracking-tight text-text-strong sm:text-base">
                  Sentadinho(a) aí! Lição de bons modos 👨‍🏫
                </DialogTitle>

                <DialogDescription className="truncate text-[11px] text-text-muted">
                  Conteúdo sexual detectado e barrado pela moderação.
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Corpo da Lição — Ultra Compacto, 100% visível sem scroll */}
        <div className="space-y-2 p-3 sm:p-4">
          <p className="text-[11px] leading-tight text-text-muted sm:text-xs">
            Achou que a coordenação não ia ver? No <strong>Énóis</strong> levamos o respeito a
            sério. Anote as regras:
          </p>

          <div className="space-y-1.5 sm:space-y-2">
            {/* Regra 1 */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-1/60 px-2.5 py-1.5 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                1
              </span>

              <div className="min-w-0 flex-1 text-[11px] sm:text-xs leading-snug">
                <strong className="text-text-strong">O feed não é quarto trancado:</strong>{" "}
                <span className="text-text-muted">Nudez e pornografia são proibidos na rede.</span>
              </div>
            </div>

            {/* Regra 2 */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-1/60 px-2.5 py-1.5 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-bold text-primary">
                2
              </span>

              <div className="min-w-0 flex-1 text-[11px] sm:text-xs leading-snug">
                <strong className="text-text-strong">A moderação não dorme:</strong>{" "}
                <span className="text-text-muted">
                  Nossa IA detecta e barra violações em tempo real.
                </span>
              </div>
            </div>

            {/* Regra 3 */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-1/60 px-2.5 py-1.5 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-[10px] font-bold text-green-600 dark:text-green-400">
                3
              </span>

              <div className="min-w-0 flex-1 text-[11px] sm:text-xs leading-snug">
                <strong className="text-text-strong">Foque no que constrói:</strong>{" "}
                <span className="text-text-muted">
                  Compartilhe projetos, debates e ideias construtivas.
                </span>
              </div>
            </div>

            {/* Regra 4 */}
            <div className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-1/60 px-2.5 py-1.5 text-xs">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/15 text-[10px] font-bold text-destructive">
                4
              </span>

              <div className="min-w-0 flex-1 text-[11px] sm:text-xs leading-snug">
                <strong className="text-text-strong">Reincidência dá suspensão:</strong>{" "}
                <span className="text-text-muted">
                  Insistir em burlar as regras gera banimento.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Direto e Fixo */}
        <DialogFooter className="border-t border-border-soft bg-surface-card px-3 py-2.5 sm:px-4 sm:py-3">
          <Button
            type="button"
            className="w-full gap-2 rounded-full py-2 text-xs font-semibold sm:w-auto sm:text-sm"
            onClick={() => onOpenChange(false)}
          >
            <CheckCircle2 className="h-4 w-4" />
            Entendido, Professor! Prometo ter bons modos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
