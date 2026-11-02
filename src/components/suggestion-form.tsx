import { useState } from "react";

import { texts } from "@/texts";
import type { SuggestionTarget } from "@/types/application/suggestion/suggestion-target";
import { Button, Input, Label, Textarea } from "@rede-enois/design-system/ui";
import { CheckCircle2, Loader2 } from "lucide-react";

import { ApiError, suggestionsApi } from "@/lib/api";

const MIN_TITLE = 5;
const MIN_BODY = 20;
const TARGETS: SuggestionTarget[] = ["FRONTEND", "BACKEND", "DESIGN_SYSTEM"];

/**
 * Formulário de sugestão. Não pede e-mail nem nome: o que a pessoa escreve só vira issue pública
 * depois da aprovação de um moderador, e o autor nunca vai junto.
 */
export function SuggestionForm({ onSent }: { onSent?: () => void } = {}) {
  const [target, setTarget] = useState<SuggestionTarget>("FRONTEND");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = () => {
    setTitle("");
    setBody("");
    setErrors({});
    setFormError(null);
    setSent(false);
  };

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < MIN_TITLE) next.title = texts.suggestions.validationTitle;
    if (body.trim().length < MIN_BODY) next.body = texts.suggestions.validationBody;
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setFormError(null);
    setSending(true);
    try {
      await suggestionsApi.submit({ target, title: title.trim(), body: body.trim() });
      setSent(true);
      onSent?.();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : texts.suggestions.error);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />

        <h2 className="mt-3 text-lg font-semibold tracking-tight">
          {texts.suggestions.successTitle}
        </h2>

        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          {texts.suggestions.successDescription}
        </p>

        <Button variant="outline" className="mt-6 rounded-full" onClick={reset}>
          {texts.suggestions.newSuggestion}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="suggestion-target">{texts.suggestions.target}</Label>

        <select
          id="suggestion-target"
          value={target}
          onChange={(event) => setTarget(event.target.value as SuggestionTarget)}
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        >
          {TARGETS.map((value) => (
            <option key={value} value={value}>
              {texts.suggestions.targets[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggestion-title">{texts.suggestions.titleLabel}</Label>

        <Input
          id="suggestion-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={texts.suggestions.titlePlaceholder}
          maxLength={120}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="suggestion-body">{texts.suggestions.bodyLabel}</Label>

        <Textarea
          id="suggestion-body"
          rows={6}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={texts.suggestions.bodyPlaceholder}
          maxLength={4000}
        />
        {errors.body && <p className="text-xs text-destructive">{errors.body}</p>}

        <p className="text-xs text-text-subtle">{texts.suggestions.publicNotice}</p>
      </div>

      {formError && (
        <p className="rounded-xl bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {formError}
        </p>
      )}

      <Button className="w-full rounded-full" disabled={sending} onClick={submit}>
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />

            <>{texts.suggestions.sending}</>
          </>
        ) : (
          texts.suggestions.action
        )}
      </Button>
    </div>
  );
}
