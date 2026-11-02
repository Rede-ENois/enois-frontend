import { useRouterState } from "@tanstack/react-router";

import { ModuleDisabledView } from "@rede-enois/design-system/patterns";

import { moduleForPath } from "@/lib/module-paths";
import { useDisabledModules, useReenableModule } from "@/lib/use-personalization";

/**
 * Acesso direto a uma área desativada nas preferências: em vez de uma tela quebrada, a
 * explicação e o atalho para reativar. A preferência é de INTERFACE — o backend continua
 * aplicando as regras de acesso dele.
 */
export function ModuleDisabledGate({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const disabled = useDisabledModules();
  const reenable = useReenableModule();
  const module = moduleForPath(pathname);

  if (!module || !disabled.has(module)) {
    return <>{children}</>;
  }

  return <ModuleDisabledView onReenable={() => reenable.mutate(module)} backHref="/feed" />;
}
