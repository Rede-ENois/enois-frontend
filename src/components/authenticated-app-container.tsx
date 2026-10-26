import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { AppLayout } from "@rede-enois/design-system/patterns";

import { useCurrentUser } from "@/lib/current-user";

import { AppSidebar } from "./app-sidebar";
import { AuthenticatedAppHeader } from "./authenticated-app-header";
import { NavigationDrawer } from "./navigation-drawer";

export function AuthenticatedAppContainer({ children }: WithRequiredChildren) {
  useCurrentUser();

  return (
    <AppLayout>
      <AppLayout.Header>
        <AuthenticatedAppHeader />
      </AppLayout.Header>

      <AppLayout.Content>
        <AppLayout.Sidebar>
          <AppSidebar />
        </AppLayout.Sidebar>

        <AppLayout.Main>{children}</AppLayout.Main>
      </AppLayout.Content>

      <AppLayout.Navigation>
        <NavigationDrawer />
      </AppLayout.Navigation>
    </AppLayout>
  );
}
