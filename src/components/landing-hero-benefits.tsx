import { texts } from "@/texts";
import { Heart, ShieldCheck, Sparkles } from "lucide-react";

export function LandingHeroBenefits() {
  const benefits = [
    { key: "no-vanity", icon: Heart, label: texts.landing.hero.benefits.noVanity },
    { key: "safe", icon: ShieldCheck, label: texts.landing.hero.benefits.safe },
    { key: "free", icon: Sparkles, label: texts.landing.hero.benefits.freeForever },
  ];

  return (
    <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-muted-foreground">
      {benefits.map((benefit) => (
        <span key={benefit.key} className="inline-flex items-center gap-1.5">
          <benefit.icon className="h-3.5 w-3.5 text-primary/60" />

          <>{benefit.label}</>
        </span>
      ))}
    </div>
  );
}
