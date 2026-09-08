import { useAuthModeTabsController } from "@/utils/components/auth/use-auth-mode-tabs-controller";

import { TabButton } from "@/components/tab-button";

export function AuthModeTabs() {
  const tabs = useAuthModeTabsController();

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
