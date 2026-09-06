import { useState } from "react";

import { AlertTriangle, ChevronDown, Copy } from "lucide-react";

import { texts } from "@/texts";
import { describeError, formatErrorDetails, getErrorHint } from "@/utils/errors";

type ErrorBannerProps = {
  error: unknown;
  className?: string;
};

export function ErrorBanner({ error, className }: ErrorBannerProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!error) return null;

  const { message, details } = describeError(error);
  const hint = getErrorHint(error);

  const copy = () => {
    navigator.clipboard?.writeText(formatErrorDetails(message, details, hint)).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className={`space-y-1.5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-2.5 text-sm text-destructive ${className ?? ""}`} role="alert">
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{message}</span></p>
        <button type="button" onClick={() => setOpen((value) => !value)} className="shrink-0 p-0.5 text-destructive/70 transition hover:text-destructive" aria-label={open ? texts.errors.details.hide : texts.errors.details.show}>
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
      </div>
      {open && (
        <div className="space-y-2 rounded-lg bg-background/40 p-3 text-xs">
          <ul className="list-inside list-disc space-y-0.5 text-destructive/90">
            {details.map((detail) => <li key={detail} className="break-all font-mono">{detail}</li>)}
          </ul>
          {hint && <p className="font-light text-destructive/90">{hint}</p>}
          {details.length > 0 && (
            <button type="button" onClick={copy} className="inline-flex items-center gap-1 font-medium text-destructive transition hover:underline">
              <Copy className="h-3 w-3" />{copied ? texts.errors.details.copied : texts.errors.details.copy}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
