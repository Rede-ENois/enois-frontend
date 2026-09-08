import type { AuthModeTabsProps } from "@/types/components/auth/auth-mode-tabs-props";
import { createAuthModeTabs } from "@/utils/components/auth/create-auth-mode-tabs";

import { TabButton } from "@/components/tab-button";

export function AuthModeTabs(props: AuthModeTabsProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {createAuthModeTabs(props).map((tab) => (
        <TabButton key={tab.key} variant="auth" active={tab.active} onClick={tab.onClick}>
          {tab.label}
        </TabButton>
      ))}
    </div>
  );
}
