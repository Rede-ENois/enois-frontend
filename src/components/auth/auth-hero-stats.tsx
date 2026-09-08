import { texts } from "@/texts";

export function AuthHeroStats() {
  return (
    <div className="relative grid grid-cols-3 gap-4 text-sm">
      {texts.auth.hero.stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-2xl font-semibold">{stat.value}</p>

          <p className="text-primary-foreground/75">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
