import { texts } from "@/texts";
import type { AuthTab } from "@/types/components/auth/auth-tab";

import { AuthTabButton } from "./auth-tab-button";

type AuthTabsProps = {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
};

export function AuthTabs({ tab, onTabChange }: AuthTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <AuthTabButton isActive={tab === "signup"} onClick={() => onTabChange("signup")}>
        {texts.common.createAccount}
      </AuthTabButton>
      <AuthTabButton isActive={tab === "login"} onClick={() => onTabChange("login")}>
        {texts.common.enter}
      </AuthTabButton>
    </div>
  );
}
