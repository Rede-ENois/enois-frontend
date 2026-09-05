import { texts } from "@/texts";

import { AuthTabButton } from "./auth-tab-button";
import type { AuthTab } from "./auth-tab";

export function AuthTabs({
  tab,
  onTabChange,
}: {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <AuthTabButton active={tab === "signup"} onClick={() => onTabChange("signup")}>
        {texts.common.createAccount}
      </AuthTabButton>
      <AuthTabButton active={tab === "login"} onClick={() => onTabChange("login")}>
        {texts.common.enter}
      </AuthTabButton>
    </div>
  );
}
