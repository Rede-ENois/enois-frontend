import type { AuthTab } from "./auth-tab";

export type AuthTabsProps = {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
};
