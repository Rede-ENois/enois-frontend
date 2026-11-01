import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, Lightbulb } from "lucide-react";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SuggestionForm } from "@/components/suggestion-form";
import { MySuggestions } from "@/components/suggestions/my-suggestions";

export const Route = createFileRoute("/sugestoes")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.suggestions.seoTitle }] }),
  component: Sugestoes,
});

function Sugestoes() {
  const queryClient = useQueryClient();

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link
          to="/feed"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />

          <>{texts.post.back}</>
        </Link>

        <div className="surface-card p-4 sm:p-6">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">{texts.suggestions.title}</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{texts.suggestions.subtitle}</p>

          <SuggestionForm
            onSent={() => void queryClient.invalidateQueries({ queryKey: ["suggestions", "mine"] })}
          />
        </div>

        <MySuggestions />
      </div>
    </AppContainer>
  );
}
