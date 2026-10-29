import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { AppLayout } from "@rede-enois/design-system/patterns";

import { useCurrentUser } from "@/lib/current-user";

import { AppSidebar } from "./app-sidebar";
import { AuthenticatedAppHeader } from "./authenticated-app-header";
import { NavigationDrawer } from "./navigation-drawer";
import { AdminNoticeBanner } from "./notices/admin-notice";

export function AuthenticatedAppContainer({ children }: WithRequiredChildren) {
  useCurrentUser();

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

        <AppLayout.Main>{children}</AppLayout.Main>
      </AppLayout.Content>

      <AppLayout.Navigation>
        <NavigationDrawer />
      </AppLayout.Navigation>
    </AppLayout>
  );
}
