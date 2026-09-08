import { useAuthMobileHeaderController } from "@/utils/auth/use-auth-mobile-header-controller";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthMobileHeader() {
  const { showThemeToggle } = useAuthMobileHeaderController();

  return (
    <div className="flex items-center justify-between lg:hidden">
      <AppBrand variant="auth-mobile" />
      {showThemeToggle && <ThemeToggle />}
    </div>
  );
}
