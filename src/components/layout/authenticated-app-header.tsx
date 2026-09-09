import { GlobalSearchProvider } from "@/components/global-search-provider";
import { MobileNavigationButton } from "@/components/navigation/mobile-navigation-button";
import { AppBrand } from "@/components/layout/app-brand";
import { AppHeaderLayout } from "@/components/layout/app-header-layout";
import { AuthenticatedAppHeaderActions } from "@/components/layout/authenticated-app-header-actions";

export function AuthenticatedAppHeader() {
  return (
    <AppHeaderLayout>
      <MobileNavigationButton />
      <AppBrand />
      <GlobalSearchProvider />
      <AuthenticatedAppHeaderActions />
    </AppHeaderLayout>
  );
}
