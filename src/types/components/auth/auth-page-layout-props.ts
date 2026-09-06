import type { ReactNode } from "react";

import type { AuthTab } from "./auth-tab";

export type AuthPageLayoutProps = {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  children: ReactNode;
};
