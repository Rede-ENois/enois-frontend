import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { PageHeader } from "@rede-enois/design-system/ui";
import { Rss } from "lucide-react";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { FeedPreferencesPanel } from "@/components/feed/feed-preferences-panel";

export const Route = createFileRoute("/conta/preferencias-feed")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.feedPreferences.seoTitle }] }),
  component: FeedPreferencesPage,
});

function FeedPreferencesPage() {
  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeader
          icon={Rss}
          title={texts.feedPreferences.title}
          description={texts.feedPreferences.description}
        />
        <FeedPreferencesPanel />
      </div>
    </AppContainer>
  );
}
