import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft, LifeBuoy } from "lucide-react";

import { buildPageShareTags } from "@/lib/open-graph";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { SupportForm } from "@/components/support-form";

export const Route = createFileRoute("/suporte")({
  beforeLoad: requireAuth,
  head: () => ({ meta: buildPageShareTags({ title: texts.support.seoTitle, path: "/suporte" }) }),
  component: Suporte,
});

function Suporte() {
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

          <SupportForm />
        </div>
      </div>
    </AppContainer>
  );
}
