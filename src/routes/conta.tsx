import { useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { AccountSettings } from "@rede-enois/design-system/domain";
import { Button } from "@rede-enois/design-system/ui";
import { Sparkles } from "lucide-react";

import { useCurrentUser } from "@/lib/current-user";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ChangeEmailDialog } from "@/components/change-email-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { HealthyUsageDialog } from "@/components/healthy-usage/healthy-usage-dialog";
import { LinkedAccountsDialog } from "@/components/linked-accounts-dialog";

export const Route = createFileRoute("/conta")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.account.settingsSeoTitle }] }),
  component: AccountSettingsPage,
});

/** "Conta e segurança" (issue #562): every account, privacy and preference item the menu left out. */
function AccountSettingsPage() {
  const { data: profile } = useCurrentUser();
  const [dialog, setDialog] = useState<
    "email" | "password" | "linked" | "delete" | "healthy" | null
  >(null);
  const openChange = (name: typeof dialog) => (open: boolean) => setDialog(open ? name : null);

  return (
    <AppContainer>
      <AccountSettings
        hrefs={{
          security: "/seguranca",
          blockedUsers: "/bloqueados",
          myReports: "/denuncias",
          sanctions: "/penalidades",
          guardian: "/responsavel",
          mutedUsers: "/silenciados",
          notificationPreferences: "/notificacoes/preferencias",
          supportUs: "/apoiar",
        }}
        onChangeEmail={() => setDialog("email")}
        onChangePassword={() => setDialog("password")}
        onOpenLinkedAccounts={() => setDialog("linked")}
        onDeleteAccount={() => setDialog("delete")}
        onOpenHealthyUsage={() => setDialog("healthy")}
      />

      <section className="mt-4 rounded-2xl border border-border-soft bg-surface-card p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Sparkles className="h-4 w-4" />
            </span>

            <div>
              <p className="text-sm font-semibold text-text-strong">
                Novidades do Sistema e Design
              </p>

              <p className="text-xs text-text-subtle">
                Veja as melhorias recentes no layout, novos componentes e recursos lançados.
              </p>
            </div>
          </div>

          <Link to="/novidades">
            <Button variant="outline" size="sm" className="w-full rounded-full sm:w-auto">
              Ver novidades
            </Button>
          </Link>
        </div>
      </section>

      {profile && (
        <ChangeEmailDialog
          open={dialog === "email"}
          onOpenChange={openChange("email")}
          currentEmail={profile.email}
        />
      )}
      <ChangePasswordDialog open={dialog === "password"} onOpenChange={openChange("password")} />
      <LinkedAccountsDialog open={dialog === "linked"} onOpenChange={openChange("linked")} />
      <DeleteAccountDialog open={dialog === "delete"} onOpenChange={openChange("delete")} />
      <HealthyUsageDialog open={dialog === "healthy"} onOpenChange={openChange("healthy")} />
    </AppContainer>
  );
}
