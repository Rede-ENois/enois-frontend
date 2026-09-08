import { LANDING_INFO_CARD_CLASS_NAMES } from "@/consts/components/landing/landing-info-card-class-names";
import type { LandingInfoCardProps } from "@/types/components/landing/landing-info-card-props";

export function LandingInfoCard({ icon: Icon, title, description, variant }: LandingInfoCardProps) {
  const classNames = LANDING_INFO_CARD_CLASS_NAMES[variant];

  return (
    <div className={classNames.card}>
      <div className={classNames.icon}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}
