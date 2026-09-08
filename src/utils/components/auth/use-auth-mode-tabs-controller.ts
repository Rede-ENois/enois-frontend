import { useNavigate, useSearch } from "@tanstack/react-router";

import { createAuthModeTabs } from "@/utils/components/auth/create-auth-mode-tabs";

export function useAuthModeTabsController() {
  const { tab } = useSearch({ from: "/entrar" });
  const navigate = useNavigate();

  return createAuthModeTabs(tab, (nextTab) => {
    void navigate({ to: "/entrar", search: { tab: nextTab } });
  });
}
