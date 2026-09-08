import { ShieldCheck } from "lucide-react";

import { texts } from "@/texts";

export function LandingPhilosophyFreeBadge() {
  return (
    <div className="mt-12 text-center">
      <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
        <ShieldCheck className="h-4 w-4" />
        <>{texts.landing.philosophy.alwaysFree}</>
      </p>
    </div>
  );
}
