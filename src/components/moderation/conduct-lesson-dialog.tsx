import { texts } from "@/texts";
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

const RULES = [
  { key: "feed", tone: "amber" },
  { key: "moderation", tone: "primary" },
  { key: "build", tone: "green" },
  { key: "repeat", tone: "destructive" },
] as const;

const NUMBER_TONE: Record<string, string> = {
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  primary: "bg-primary/15 text-primary",
  green: "bg-green-500/15 text-green-600 dark:text-green-400",
  destructive: "bg-destructive/15 text-destructive",
};

/**
 * Aviso educativo exibido quando a moderação barra um arquivo impróprio no envio: repreende
 * com bom humor e didática, compacto o bastante para caber sem scroll em qualquer tela.
 */
export function ConductLessonDialog({ open, onOpenChange }: ConductLessonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-border-soft p-0 max-w-[calc(100vw-2rem)] sm:max-w-lg">
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 via-primary/10 to-destructive/15 px-4 py-3 sm:px-5 sm:py-4">
          <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-xl" />
          <div className="pointer-events-none absolute -bottom-6 -left-6 h-20 w-20 rounded-full bg-amber-500/20 blur-xl" />

          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-surface-card/90 shadow-xs backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-amber-500 dark:text-amber-400" aria-hidden />
              <Sparkles
                className="absolute -right-1 -top-1 h-3.5 w-3.5 animate-spin text-primary"
                aria-hidden
              />
            </div>

            <div className="min-w-0 flex-1 pr-6">
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                <ShieldAlert className="h-2.5 w-2.5" aria-hidden />

                <>{texts.conductLesson.badge}</>
              </span>

              <DialogHeader className="mt-0.5 space-y-0 text-left">
                <DialogTitle className="text-sm font-bold tracking-tight text-text-strong sm:text-base">
                  <>{texts.conductLesson.title}</>
                </DialogTitle>

                <DialogDescription className="truncate text-[11px] text-text-subtle">
                  <>{texts.conductLesson.description}</>
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3 sm:p-4">
          <p className="text-[11px] leading-tight text-text-subtle sm:text-xs">
            <>{texts.conductLesson.intro}</>
          </p>

          <div className="space-y-1.5 sm:space-y-2">
            {RULES.map((rule, index) => (
              <div
                key={rule.key}
                className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-1/60 px-2.5 py-1.5 text-xs"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${NUMBER_TONE[rule.tone]}`}
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1 text-[11px] leading-snug sm:text-xs">
                  <strong className="text-text-strong">
                    <>{texts.conductLesson.rules[rule.key].title}</>
                  </strong>{" "}
                  <span className="text-text-subtle">
                    <>{texts.conductLesson.rules[rule.key].body}</>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-border-soft bg-surface-card px-3 py-2.5 sm:px-4 sm:py-3">
          <Button
            type="button"
            className="w-full gap-2 rounded-full py-2 text-xs font-semibold sm:w-auto sm:text-sm"
            onClick={() => onOpenChange(false)}
          >
            <CheckCircle2 className="h-4 w-4" aria-hidden />

            <>{texts.conductLesson.dismiss}</>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
