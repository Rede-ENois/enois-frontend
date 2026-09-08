import { AppBrand } from "@/components/app-brand";
import { LandingAuthActions } from "@/components/landing-auth-actions";
import { LandingNavigation } from "@/components/landing-navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <AppBrand variant="public" />
        <LandingNavigation />

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <LandingAuthActions />
        </div>
      </div>
    </header>
  );
}
