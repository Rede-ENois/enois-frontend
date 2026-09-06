import { Link } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";

import { texts } from "@/texts";
import type { AuthPageLayoutProps } from "@/types/components/auth/auth-page-layout-props";

import { ThemeToggle } from "@/components/theme-toggle";

export function AuthPageLayout({ children, showThemeToggle = false }: AuthPageLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside
        className="relative hidden flex-col justify-between overflow-hidden p-10 text-primary-foreground lg:flex"
        style={{ background: "var(--gradient-primary)" }}
      >
        <div
          aria-hidden
          className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-primary-foreground/10 blur-3xl"
        />

        <AuthBrand variant="desktop" />

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
          <AuthBrand variant="mobile" />
          {showThemeToggle && <ThemeToggle />}
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </section>
    </div>
  );
}

function AuthBrand({ variant }: { variant: "desktop" | "mobile" }) {
  const desktop = variant === "desktop";

  return (
    <Link to="/" className={desktop ? "relative flex items-center gap-2" : "flex items-center gap-2"}>
      <div
        className={
          desktop
            ? "grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 backdrop-blur"
            : "grid h-9 w-9 place-items-center rounded-xl text-primary-foreground"
        }
        style={desktop ? undefined : { background: "var(--gradient-primary)" }}
      >
        <Sparkles className="h-4 w-4" />
      </div>
      <span className={desktop ? "text-lg font-semibold tracking-tight" : "font-semibold tracking-tight"}>
        <>{texts.brand.prefix}</><span className="gradient-text">{texts.brand.accent}</span>
      </span>
    </Link>
  );
}
