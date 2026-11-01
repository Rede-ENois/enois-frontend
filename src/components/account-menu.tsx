import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { AccountMenuProps } from "@/types/components/account/account-menu-props";
import type { InterfaceContext } from "@rede-enois/design-system/domain";
import { AccountMenu as AccountMenuView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";
import { Briefcase, UsersRound } from "lucide-react";

import { corporateApi } from "@/lib/api";
import {
  destinationAfterSwitch,
  professionalProfileState,
  useInterfaceContext,
  writeStoredContext,
} from "@/lib/interface-context";
import { logout } from "@/lib/logout";
import { hasSessionFlag } from "@/lib/session";

import { ChangeEmailDialog } from "./change-email-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import { DeleteAccountDialog } from "./delete-account-dialog";
import { HealthyUsageDialog } from "./healthy-usage/healthy-usage-dialog";
import { LinkedAccountsDialog } from "./linked-accounts-dialog";
import { PushToggle } from "./push-toggle";

const ACCOUNT_MENU_HREFS = {
  corporateProfile: "/profissional",
  wallet: "/carteira",
  marketplace: "/carteira?tab=loja",
  support: "/suporte",
  security: "/seguranca",
  blockedUsers: "/bloqueados",
  myReports: "/denuncias",
  sanctions: "/penalidades",
  guardian: "/responsavel",
  moderator: "/moderador",
  apoie: "/apoiar",
  notificationPreferences: "/notificacoes/preferencias",
};

/** Account menu: identity switcher, logout and the account dialogs. */
export function AccountMenu({ profile }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [showLinkedAccounts, setShowLinkedAccounts] = useState(false);
  const [showHealthyUsage, setShowHealthyUsage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();

  const context = useInterfaceContext();
  const {
    data: corporate,
    isError: corporateError,
    isFetching: corporateFetching,
    refetch: refetchCorporate,
  } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: hasSessionFlag(),
    staleTime: 120_000,
  });
  const corporateState = professionalProfileState({ data: corporate, isError: corporateError });
  const showSwitch = corporateState === "ACTIVE";

  const choose = (next: InterfaceContext) => {
    writeStoredContext(next);
    setMenuOpen(false);
    const destination = destinationAfterSwitch(window.location.pathname, next);
    if (destination) window.location.assign(destination);
  };

  const openDialog = (show: (open: boolean) => void) => () => {
    setMenuOpen(false);
    show(true);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    if (await logout()) return;
    setLoggingOut(false);
    toast(texts.account.menu.logoutFailed, "error", {
      label: texts.account.menu.logoutRetry,
      onClick: () => void handleLogout(),
    });
  };

  return (
    <>
      <AccountMenuView
        profile={profile}
        hrefs={{
          ...ACCOUNT_MENU_HREFS,
          profile:
            context === "PROFESSIONAL" && corporate?.username
              ? `/profissional/${corporate.username}`
              : `/perfil/${profile.username}`,
        }}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        onChangeEmail={openDialog(setShowChangeEmail)}
        onChangePassword={openDialog(setShowChangePassword)}
        onOpenLinkedAccounts={openDialog(setShowLinkedAccounts)}
        onOpenHealthyUsage={openDialog(setShowHealthyUsage)}
        onDeleteAccount={openDialog(setShowDeleteAccount)}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
        pushToggle={<PushToggle onClose={() => setMenuOpen(false)} />}
        identitySlot={
          showSwitch ? (
            <div className="flex rounded-full border border-border-soft p-0.5">
              {(["SOCIAL", "PROFESSIONAL"] as const).map((option) => {
                const selected = context === option;
                const Icon = option === "SOCIAL" ? UsersRound : Briefcase;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => choose(option)}
                    className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium transition ${
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "text-text-subtle hover:text-text-strong"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />

                    <>{option === "SOCIAL" ? "Social" : "Profissional"}</>
                  </button>
                );
              })}
            </div>
          ) : corporateState === "ERROR" ? (
            // A failed request is not "no professional profile": say so and let the person retry.
            <div className="flex items-center justify-between gap-2 text-xs text-text-subtle">
              <span className="min-w-0">{texts.account.menu.identityLoadError}</span>

              <button
                type="button"
                disabled={corporateFetching}
                onClick={() => void refetchCorporate()}
                className="shrink-0 rounded-full px-2 py-1 font-medium text-text-strong transition hover:text-primary disabled:opacity-50"
              >
                {texts.account.menu.identityRetry}
              </button>
            </div>
          ) : undefined
        }
      />
      <ChangeEmailDialog
        open={showChangeEmail}
        onOpenChange={setShowChangeEmail}
        currentEmail={profile.email}
      />
      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
      <DeleteAccountDialog open={showDeleteAccount} onOpenChange={setShowDeleteAccount} />
      <LinkedAccountsDialog open={showLinkedAccounts} onOpenChange={setShowLinkedAccounts} />
      <HealthyUsageDialog open={showHealthyUsage} onOpenChange={setShowHealthyUsage} />
    </>
  );
}
