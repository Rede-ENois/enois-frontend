import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export function LandingHeroActions() {
  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Link to="/entrar" search={{ tab: "signup" }}>
        <Button size="lg" className="gap-2 rounded-full px-6">
          <>{texts.landing.hero.join} </>

          <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <Link to="/feed">
        <Button size="lg" variant="outline" className="rounded-full px-6">
          {texts.landing.hero.explore}
        </Button>
      </Link>
    </div>
  );
}
