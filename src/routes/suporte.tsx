import { useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, LifeBuoy } from "lucide-react";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SupportForm } from "@/components/support-form";
import { MySupportRequests } from "@/components/support/my-support-requests";

export const Route = createFileRoute("/suporte")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.support.seoTitle }] }),
  component: Suporte,
});

function Suporte() {
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
            <LifeBuoy className="h-5 w-5 text-primary" />

            <h1 className="text-2xl font-semibold tracking-tight">{texts.support.title}</h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">{texts.support.subtitle}</p>

          <SupportForm
            onSent={() => void queryClient.invalidateQueries({ queryKey: ["support", "mine"] })}
          />
        </div>

        <Link to="/sugestoes" className="block text-sm text-primary-text hover:underline">
          {texts.suggestions.link}
        </Link>

        <MySupportRequests />
      </div>
    </AppContainer>
  );
}
