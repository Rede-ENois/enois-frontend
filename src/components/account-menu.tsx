import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

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

import { HealthyUsageDialog } from "./healthy-usage/healthy-usage-dialog";

const ACCOUNT_MENU_HREFS = {
  corporateProfile: "/profissional",
  wallet: "/carteira",
  marketplace: "/carteira?tab=loja",
  support: "/suporte",
  // E-mail, password, linked logins, security, blocks, reports, sanctions and account deletion
  // live on this page; the menu keeps one entry for it (issue #562).
  account: "/conta",
  guardian: "/responsavel",
  moderator: "/moderador",
  apoie: "/apoiar",
};

/** Account menu: identity switcher, logout and the account dialogs. */
export function AccountMenu({ profile }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showHealthyUsage, setShowHealthyUsage] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { toast } = useToast();

  const context = useInterfaceContext();
  const navigate = useNavigate();
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

  // The side menu swaps its items with the interface: the toast says so, or the old items look
  // gone (#560). Client-side navigation keeps the toast, which a full page load would drop.
  const choose = (next: InterfaceContext) => {
    if (next === context) return;
    writeStoredContext(next);
    setMenuOpen(false);
    const destination = destinationAfterSwitch(window.location.pathname, next);
    if (destination) void navigate({ to: destination });
    toast(texts.account.menu.switchedTo[next]);
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
        onOpenHealthyUsage={openDialog(setShowHealthyUsage)}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
        identitySlot={
          showSwitch ? (
            <div className="flex flex-col gap-1.5">
              {/* O menu troca inteiro ao alternar: dizer em qual perfil a pessoa está evita que a
                  troca de opções seja lida como bug (issue #560). */}
              <p className="text-xs text-text-subtle">
                {texts.account.menu.activeIdentity[context]}
              </p>

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
      <HealthyUsageDialog open={showHealthyUsage} onOpenChange={setShowHealthyUsage} />
    </>
  );
}
