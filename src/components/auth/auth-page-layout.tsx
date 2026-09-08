import type { WithRequiredChildren } from "@/types/components/with-required-children";

import { AppBrand } from "@/components/app-brand";
import { AuthBackgroundBlobs } from "@/components/auth/auth-background-blobs";
import { AuthHeroContent } from "@/components/auth/auth-hero-content";
import { AuthHeroStats } from "@/components/auth/auth-hero-stats";
import { AuthMobileHeader } from "@/components/auth/auth-mobile-header";

export function AuthPageLayout({ children }: WithRequiredChildren) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <AuthBackgroundBlobs />
        <AppBrand variant="auth-desktop" />
        <AuthHeroContent />
        <AuthHeroStats />
      </aside>

      <section className="flex flex-col px-6 py-10 sm:px-12">
        <AuthMobileHeader />

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </section>
    </div>
  );
}
