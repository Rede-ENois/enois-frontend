import { texts } from "@/texts";

export function AuthHeroContent() {
  return (
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
  );
}
