import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { SuggestionStatus } from "@/types/application/suggestion/suggestion-status";
import { Button, LoadingState, useToast } from "@rede-enois/design-system/ui";
import { Check, ExternalLink, X } from "lucide-react";

import { ApiError, suggestionsApi } from "@/lib/api";
import { dataHora } from "@/lib/date/format";

const FILTERS: { status: SuggestionStatus; label: string }[] = [
  { status: "PENDING", label: texts.suggestions.admin.filterPending },
  { status: "PUBLISHED", label: texts.suggestions.admin.filterPublished },
  { status: "REJECTED", label: texts.suggestions.admin.filterRejected },
];

/**
 * Fila de sugestões do painel. Aprovar abre a issue PÚBLICA no repositório do destino, então o
 * moderador confere o texto antes: nome e e-mail do autor nunca vão junto, mas o que ele digitou vai.
 */
export function SuggestionsSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [status, setStatus] = useState<SuggestionStatus>("PENDING");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["moderator", "suggestions", status],
    queryFn: () => suggestionsApi.adminList({ status, limit: 100 }),
    retry: false,
  });

  const review = useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      approve ? suggestionsApi.approve(id) : suggestionsApi.reject(id),
    onSuccess: (_result, { approve }) => {
      toast(
        approve ? texts.suggestions.admin.approved : texts.suggestions.admin.rejected,
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["moderator", "suggestions"] });
    },
    onError: (err) =>
      toast(err instanceof ApiError ? err.message : texts.suggestions.admin.actionError, "error"),
  });

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.status}
            size="sm"
            variant={status === filter.status ? "default" : "outline"}
            className="rounded-full"
            onClick={() => setStatus(filter.status)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {status === "PENDING" && (
        <p className="text-xs text-text-subtle">{texts.suggestions.admin.publicWarning}</p>
      )}

      {isLoading && <LoadingState />}

      {isError && <p className="text-sm text-destructive">{texts.suggestions.admin.error}</p>}

      {!isLoading && !isError && (data ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">{texts.suggestions.admin.empty}</p>
      )}

      <ul className="space-y-3">
        {(data ?? []).map((suggestion) => (
          <li
            key={suggestion.id}
            className="min-w-0 space-y-2 rounded-xl border border-border-soft bg-surface-card p-4"
          >
            <p className="text-xs text-text-subtle">
              {texts.suggestions.targets[suggestion.target]} · {dataHora(suggestion.createdAt)}
            </p>

            <p className="break-words text-sm font-semibold">{suggestion.title}</p>

            <p className="whitespace-pre-wrap break-words text-sm text-text-strong">
              {suggestion.body}
            </p>

            {suggestion.githubIssueUrl && (
              <a
                href={suggestion.githubIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-primary-text hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />

                <>{texts.suggestions.openIssue}</>
              </a>
            )}

            {suggestion.status === "PENDING" && (
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="rounded-full"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: suggestion.id, approve: true })}
                >
                  <Check className="h-4 w-4" />

                  <>{texts.suggestions.admin.approve}</>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  disabled={review.isPending}
                  onClick={() => review.mutate({ id: suggestion.id, approve: false })}
                >
                  <X className="h-4 w-4" />

                  <>{texts.suggestions.admin.reject}</>
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
