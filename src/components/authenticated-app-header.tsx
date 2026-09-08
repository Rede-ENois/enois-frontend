import { AppBrand } from "./app-brand";
import { AppHeaderLayout } from "./app-header-layout";
import { AuthenticatedAppHeaderActions } from "./authenticated-app-header-actions";
import { GlobalSearch } from "./global-search";
import { MobileNavigationButton } from "./mobile-navigation-button";

export function AuthenticatedAppHeader() {
  return (
    <AppHeaderLayout>
      <MobileNavigationButton />
      <AppBrand />
      <GlobalSearch />
      <AuthenticatedAppHeaderActions />
    </AppHeaderLayout>
  );
}
