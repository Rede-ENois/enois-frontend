import { texts } from "@/texts";
import type { AuthPageLayoutProps } from "@/types/components/auth/auth-page-layout-props";

import { AppBrand } from "@/components/app-brand";
import { ThemeToggle } from "@/components/theme-toggle";

export function AuthPageLayout({ children, showThemeToggle = false }: AuthPageLayoutProps) {
  const backgroundBlobs = [
    "-right-20 -top-20",
    "-bottom-32 -left-20",
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        {backgroundBlobs.map((position) => (
          <div
            key={position}
            aria-hidden
            className={`absolute h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl ${position}`}
          />
        ))}

        <AppBrand variant="auth-desktop" />

        <div className="relative max-w-md">
          <p className="text-sm font-medium uppercase tracking-wider text-primary-foreground/80">
            {texts.auth.hero.eyebrow}
          </p>

          <h2 className="mt-3 text-4xl font-semibold leading-tight tracking-tight">
            {texts.auth.hero.quote}
          </h2>

          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary-foreground/25" />

            <div>
              <p className="font-medium">{texts.auth.hero.person}</p>

              <p className="text-sm text-primary-foreground/75">{texts.auth.hero.role}</p>
            </div>
          </div>
        </div>

        <div className="relative grid grid-cols-3 gap-4 text-sm">
          {texts.auth.hero.stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold">{stat.value}</p>

              <p className="text-primary-foreground/75">{stat.label}</p>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex flex-col px-6 py-10 sm:px-12">
        <div className="flex items-center justify-between lg:hidden">
          <AppBrand variant="auth-mobile" />
          {showThemeToggle && <ThemeToggle />}
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </section>
    </div>
  );
}
