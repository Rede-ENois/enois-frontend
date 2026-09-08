import { texts } from "@/texts";
import type { ErrorBannerProps } from "@/types/components/error-banner/error-banner-props";
import { useErrorBannerController } from "@/utils/components/error-banner/use-error-banner-controller";
import { AlertTriangle, ChevronDown, Copy } from "lucide-react";

export function ErrorBanner({ error, className }: ErrorBannerProps) {
  const controller = useErrorBannerController(error);

  if (!controller.visible) return null;

  return (
    <div
      className={`space-y-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive ${className ?? ""}`}
      role="alert"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{controller.message}</span>
        </p>

        <button
          type="button"
          onClick={controller.toggle}
          className="shrink-0 p-0.5 text-destructive/70 transition hover:text-destructive"
          aria-label={controller.toggleLabel}
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${controller.open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {controller.open && (
        <div className="space-y-2 rounded-lg bg-background/40 p-3 text-xs">
          <ul className="list-inside list-disc space-y-0.5 text-destructive/90">
            {controller.details.map((detail) => (
              <li key={detail} className="break-all font-mono">
                {detail}
              </li>
            ))}
          </ul>
          {controller.hint && <p className="font-light text-destructive/90">{controller.hint}</p>}
          {controller.showCopy && (
            <button
              type="button"
              onClick={controller.copy}
              className="inline-flex items-center gap-1 font-medium text-destructive transition hover:underline"
            >
              <Copy className="h-3 w-3" />

              <>{controller.copyLabel}</>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
