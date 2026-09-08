import { LANDING_HERO_BENEFITS } from "@/constants/landing-hero-benefits";

export function LandingHeroBenefits() {
  return (
    <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
      {LANDING_HERO_BENEFITS.map((benefit) => (
        <span key={benefit.key} className="inline-flex items-center gap-1.5">
          <benefit.icon className="h-3.5 w-3.5 text-primary/60" />

          <>{benefit.label}</>
        </span>
      ))}
    </div>
  );
}
