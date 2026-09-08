import type { AuthPageLayoutProps } from "@/types/components/auth/auth-page-layout-props";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthMobileHeader({
  showThemeToggle,
}: Pick<AuthPageLayoutProps, "showThemeToggle">) {
  return (
    <div className="flex items-center justify-between lg:hidden">
      <AppBrand variant="auth-mobile" />
      {showThemeToggle && <ThemeToggle />}
    </div>
  );
}
