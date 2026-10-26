import { useQueryClient } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";

import { ModuleDisabledView } from "@rede-enois/design-system/patterns";

import { preferencesApi } from "@/lib/api";
import { moduleForPath } from "@/lib/module-paths";
import { useDisabledModules } from "@/lib/use-personalization";

/**
 * Acesso direto a uma área desativada nas preferências: em vez de uma tela quebrada, a
 * explicação e o atalho para reativar. A preferência é de INTERFACE — o backend continua
 * aplicando as regras de acesso dele.
 */
export function ModuleDisabledGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const disabled = useDisabledModules();
  const queryClient = useQueryClient();
  const module = moduleForPath(pathname);

  if (!module || !disabled.has(module)) {
    return <>{children}</>;
  }

  const reenable = async () => {
    await preferencesApi.setPersonalization({
      disabledModules: [...disabled].filter((value) => value !== module),
    });
    void queryClient.invalidateQueries({ queryKey: ["personalization"] });
  };

  return <ModuleDisabledView onReenable={() => void reenable()} backHref="/feed" />;
}
