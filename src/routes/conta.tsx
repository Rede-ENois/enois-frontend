import { useState } from "react";

import { createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { AccountSettings } from "@rede-enois/design-system/domain";

import { useCurrentUser } from "@/lib/current-user";
import { requireAuth } from "@/lib/require-auth";

import { AppContainer } from "@/components/app-container";
import { ChangeEmailDialog } from "@/components/change-email-dialog";
import { ChangePasswordDialog } from "@/components/change-password-dialog";
import { DeleteAccountDialog } from "@/components/delete-account-dialog";
import { LinkedAccountsDialog } from "@/components/linked-accounts-dialog";

export const Route = createFileRoute("/conta")({
  beforeLoad: requireAuth,
  head: () => ({ meta: [{ title: texts.account.settingsSeoTitle }] }),
  component: AccountSettingsPage,
});

/** "Conta e segurança" (issue #562): the account items that used to crowd the account menu. */
function AccountSettingsPage() {
  const { data: profile } = useCurrentUser();
  const [dialog, setDialog] = useState<"email" | "password" | "linked" | "delete" | null>(null);
  const openChange = (name: typeof dialog) => (open: boolean) => setDialog(open ? name : null);

  return (
    <AppContainer>
      <AccountSettings
        hrefs={{
          security: "/seguranca",
          blockedUsers: "/bloqueados",
          myReports: "/denuncias",
          sanctions: "/penalidades",
        }}
        onChangeEmail={() => setDialog("email")}
        onChangePassword={() => setDialog("password")}
        onOpenLinkedAccounts={() => setDialog("linked")}
        onDeleteAccount={() => setDialog("delete")}
      />

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
    </AppContainer>
  );
}
