import { useAuthenticatedAppHeaderController } from "@/utils/components/app/use-authenticated-app-header-controller";

import { AppBrand } from "./app-brand";
import { AppHeaderLayout } from "./app-header-layout";
import { AuthenticatedAppHeaderActions } from "./authenticated-app-header-actions";
import { GlobalSearch } from "./global-search";
import { MobileNavigationButton } from "./mobile-navigation-button";

export function AuthenticatedAppHeader() {
  const controller = useAuthenticatedAppHeaderController();

  return (
    <AppHeaderLayout>
      <MobileNavigationButton onClick={controller.openMobileNavigation} />
      <AppBrand />
      <GlobalSearch />
      <AuthenticatedAppHeaderActions
        profile={controller.profile}
        showProfile={controller.showProfile}
      />
    </AppHeaderLayout>
  );
}
