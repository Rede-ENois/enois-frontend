import type { WithRequiredChildren } from "@/types/components/with-required-children";
import { useAuthenticatedAppContainerController } from "@/utils/components/app/use-authenticated-app-container-controller";

import { NavigationDrawer } from "@/components/navigation-drawer";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthenticatedAppHeader } from "@/components/layout/authenticated-app-header";

export function AuthenticatedAppContainer({ children }: WithRequiredChildren) {
  useAuthenticatedAppContainerController();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedAppHeader />

      <div className="mx-auto flex max-w-7xl gap-6 px-3 py-4 sm:px-6 sm:py-6 lg:pb-6">
        <AppSidebar />

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <NavigationDrawer />
    </div>
  );
}
