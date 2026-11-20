import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { AppLayout } from "@rede-enois/design-system/patterns";

import { useCurrentUser } from "@/lib/current-user";
import { usePresenceHeartbeat } from "@/lib/use-presence-heartbeat";

import { AppSidebar } from "./app-sidebar";
import { AuthenticatedAppHeader } from "./authenticated-app-header";
import { MobileDock } from "./mobile-dock";
import { NavigationDrawer } from "./navigation-drawer";
import { AdminNoticeBanner } from "./notices/admin-notice";

export function AuthenticatedAppContainer({ children }: WithRequiredChildren) {
  const conta = useCurrentUser();
  usePresenceHeartbeat();

  // Abrir a página antes da conta chegar fazia o detalhe de rota buscar cedo, receber 401 sem o
  // cookie ainda posto, desistir na repetição e cair no vazio — o mesmo da tela de item
  // inexistente (#994, #996, #997). Quem está sem sessão também fica aqui; quem manda essa pessoa
  // para o login é o guard de rota.
  const esperandoConta = conta.isPending;

  return (
    <AppLayout>
      <AppLayout.Header>
        <AuthenticatedAppHeader />
      </AppLayout.Header>

      <AdminNoticeBanner />

      <AppLayout.Content>
        <AppLayout.Sidebar>
          <AppSidebar />
        </AppLayout.Sidebar>

        <AppLayout.Main>{esperandoConta ? null : children}</AppLayout.Main>
      </AppLayout.Content>

      <AppLayout.Navigation>
        <NavigationDrawer />
        <MobileDock />
      </AppLayout.Navigation>
    </AppLayout>
  );
}
