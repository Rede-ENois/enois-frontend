import { Link } from "@tanstack/react-router";

import { Sparkles } from "lucide-react";

import { texts } from "@/texts";

export function AuthHeroPanel() {
  return (
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

      <Link to="/" className="relative flex items-center gap-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/20 backdrop-blur">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold tracking-tight">
          {texts.brand.prefix}
          <span className="gradient-text">{texts.brand.accent}</span>
        </span>
      </Link>

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
  );
}
