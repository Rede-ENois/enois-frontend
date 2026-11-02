import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { AccountMenuProps } from "@/types/components/account/account-menu-props";
import type { InterfaceContext } from "@rede-enois/design-system/domain";
import { AccountMenu as AccountMenuView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";
import { Briefcase, UsersRound } from "lucide-react";

import { corporateApi, moderationApi } from "@/lib/api";
import {
  destinationAfterSwitch,
  professionalProfileState,
  useInterfaceContext,
  writeStoredContext,
} from "@/lib/interface-context";
import { logout } from "@/lib/logout";
import { walletQueries } from "@/lib/query-options/wallet";
import { hasSessionFlag } from "@/lib/session";

import { ThemeSwitch } from "@/components/theme-toggle";

const ACCOUNT_MENU_HREFS = {
  wallet: "/carteira",
  support: "/suporte",
  // Every account, privacy and preference item lives on this page; the menu keeps six quick
  // entries (issue #562, and the "menu inchado" report of 2026-11-02).
  account: "/conta",
};

/** Account menu: identity switcher, wallet balance, theme and logout. */
export function AccountMenu({ profile }: AccountMenuProps) {
  const [menuOpen, setMenuOpen] = useState(false);
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
  // The balance only matters once the menu is open; the moderator panel shows only for whoever
  // moderates (everyone else applies from Explore).
  const { data: wallet } = useQuery({ ...walletQueries.wallet(), enabled: menuOpen });
  const { data: moderator } = useQuery({
    queryKey: ["moderator", "me"],
    queryFn: () => moderationApi.me(),
    enabled: menuOpen,
    retry: false,
    staleTime: 600_000,
  });
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
        profile={{
          name: profile.name,
          username: profile.username,
          avatar: profile.avatar,
          avatarFrame: profile.avatarFrame,
        }}
        hrefs={{
          ...ACCOUNT_MENU_HREFS,
          profile:
            context === "PROFESSIONAL" && corporate?.username
              ? `/profissional/${corporate.username}`
              : `/perfil/${profile.username}`,
          moderator:
            moderator && (moderator.moderator || moderator.admin) ? "/moderador" : undefined,
        }}
        open={menuOpen}
        onOpenChange={setMenuOpen}
        walletLabel={wallet ? texts.account.menu.walletBalance(wallet.balance) : null}
        themeSlot={<ThemeSwitch />}
        onLogout={() => void handleLogout()}
        loggingOut={loggingOut}
        identitySlot={
          showSwitch ? (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 rounded-full bg-surface-2 p-1">
                {(["SOCIAL", "PROFESSIONAL"] as const).map((option) => {
                  const selected = context === option;
                  const Icon = option === "SOCIAL" ? UsersRound : Briefcase;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => choose(option)}
                      aria-pressed={selected}
                      className={`flex h-10 items-center justify-center gap-2 rounded-full text-sm font-bold transition ${
                        selected
                          ? "bg-primary text-primary-foreground"
                          : "text-text-subtle hover:text-text-strong"
                      }`}
                    >
                      <Icon aria-hidden className="h-[18px] w-[18px]" />

                      <>{option === "SOCIAL" ? "Social" : "Profissional"}</>
                    </button>
                  );
                })}
              </div>

              {/* O menu troca inteiro ao alternar: dizer em qual perfil a pessoa está evita que a
                  troca de opções seja lida como bug (issue #560). */}
              <p className="px-2 text-[13px] text-text-date">
                {texts.account.menu.activeIdentity[context]}
              </p>
            </div>
          ) : corporateState === "ERROR" ? (
            // A failed request is not "no professional profile": say so and let the person retry.
            <div className="flex items-center justify-between gap-2 px-2 text-[13px] text-text-subtle">
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
    </>
  );
}
