import { texts } from "@/texts";
import type { MentoringHeroProps } from "@/types/components/mentoring/mentoring-hero-props";
import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { RegisterMentorDialog } from "@/components/register-mentor-dialog";

export function MentoringHero({ onFindMentor }: MentoringHeroProps) {
  return (
    <section
      className="surface-card relative overflow-hidden p-5 sm:p-8"
      style={{ background: "var(--gradient-soft)" }}
    >
      <div className="relative">
        <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
          <Sparkles className="mr-1 h-3 w-3" />

          <>{texts.mentoring.badge}</>
        </Badge>

        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{texts.mentoring.title}</h1>

        <p className="mt-2 text-muted-foreground">{texts.mentoring.description}</p>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button className="rounded-full" onClick={onFindMentor}>
            {texts.mentoring.findMentor}
          </Button>

          <RegisterMentorDialog />
        </div>
      </div>
    </section>
  );
}
