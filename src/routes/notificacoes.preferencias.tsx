import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { PageHeader } from "@rede-enois/design-system/ui";
import { BellRing } from "lucide-react";

import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { NotificationPreferencesPanel } from "@/components/notifications/notification-preferences-panel";

export const Route = createFileRoute("/notificacoes/preferencias")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.notificationPreferences.seoTitle }] }),
  component: NotificationPreferencesPage,
});

function NotificationPreferencesPage() {
  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <PageHeader
          icon={BellRing}
          title={texts.notificationPreferences.title}
          description={texts.notificationPreferences.description}
        />
        <NotificationPreferencesPanel />
      </div>
    </AppContainer>
  );
}
