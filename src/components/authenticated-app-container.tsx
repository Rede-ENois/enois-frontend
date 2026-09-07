import type { WithRequiredChildren } from "@/types/components/with-required-children";

import { useCurrentUser } from "@/lib/current-user";

import { AppSidebar } from "./app-sidebar";
import { AuthenticatedAppHeader } from "./authenticated-app-header";
import { NavigationDrawer } from "./navigation-drawer";

export function AuthenticatedAppContainer({ children }: WithRequiredChildren) {
  useCurrentUser();

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
