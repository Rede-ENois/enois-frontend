import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import { LoadingState } from "@rede-enois/design-system/ui";
import { ExternalLink } from "lucide-react";

import { suggestionsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

/** Histórico de quem sugeriu: é aqui que o link da issue pública aparece, depois da aprovação. */
export function MySuggestions() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["suggestions", "mine"],
    queryFn: () => suggestionsApi.mine(20),
  });

  return (
    <section className="surface-card space-y-3 p-4 sm:p-6">
      <h2 className="text-lg font-semibold tracking-tight">{texts.suggestions.mineTitle}</h2>

      {isLoading && <LoadingState />}

      {isError && <p className="text-sm text-destructive">{texts.suggestions.mineError}</p>}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">{texts.suggestions.mineEmpty}</p>
      )}

      <ul className="space-y-3">
        {(data ?? []).map((suggestion) => (
          <li
            key={suggestion.id}
            className="min-w-0 rounded-xl border border-border-soft bg-surface-card p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="min-w-0 break-words text-sm font-medium">{suggestion.title}</p>

              <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary-text">
                {texts.suggestions.status[suggestion.status]}
              </span>
            </div>

            <p className="mt-1 text-xs text-text-subtle">
              {texts.suggestions.targets[suggestion.target]} · {dataHora(suggestion.createdAt)}
            </p>

            {suggestion.githubIssueUrl && (
              <a
                href={suggestion.githubIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-primary-text hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />

                <>{texts.suggestions.openIssue}</>
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
