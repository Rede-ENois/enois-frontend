import { texts } from "@/texts";
import type { AuthModeTab } from "@/types/auth/auth-mode-tab";

export function createAuthModeTabs(
  activeTab: "signup" | "login",
  selectTab: (tab: "signup" | "login") => void,
): AuthModeTab[] {
  return [
    {
      key: "signup",
      active: activeTab === "signup",
      onClick: () => selectTab("signup"),
      label: texts.common.createAccount,
    },
    {
      key: "login",
      active: activeTab === "login",
      onClick: () => selectTab("login"),
      label: texts.common.enter,
    },
  ];
}
