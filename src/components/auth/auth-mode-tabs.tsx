import { texts } from "@/texts";
import type { AuthModeTabsProps } from "@/types/components/auth/auth-mode-tabs-props";

import { TabButton } from "@/components/tab-button";

export function AuthModeTabs({
  signupActive,
  loginActive,
  onSelectSignup,
  onSelectLogin,
}: AuthModeTabsProps) {
  const tabs = [
    {
      key: "signup",
      active: signupActive,
      onClick: onSelectSignup,
      label: texts.common.createAccount,
    },
    {
      key: "login",
      active: loginActive,
      onClick: onSelectLogin,
      label: texts.common.enter,
    },
  ];

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {tabs.map((tab) => (
        <TabButton key={tab.key} variant="auth" active={tab.active} onClick={tab.onClick}>
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
}
