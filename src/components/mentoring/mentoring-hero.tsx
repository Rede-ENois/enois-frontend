import { Sparkles } from "lucide-react";

import { texts } from "@/texts";
import type { MentoringHeroProps } from "@/types/components/mentoring/mentoring-hero-props";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RegisterMentorDialog } from "./register-mentor-dialog";

export function MentoringHero({
  isRegistrationOpen,
  isRegistrationPending,
  onRegistrationOpenChange,
  onRegister,
}: MentoringHeroProps) {
  return (
    <div
      className="surface-card relative overflow-hidden p-5 sm:p-8"
      style={{ background: "var(--gradient-soft)" }}
    >
      <div className="relative">
        <Badge className="rounded-full bg-primary-soft text-primary hover:bg-primary-soft">
          <Sparkles className="mr-1 h-3 w-3" /> {texts.mentoring.badge}
        </Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{texts.mentoring.title}</h1>
        <p className="mt-2 text-muted-foreground">{texts.mentoring.description}</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            className="rounded-full"
            onClick={() => document.getElementById("mentores-lista")?.scrollIntoView({ behavior: "smooth" })}
          >
            {texts.mentoring.findMentor}
          </Button>
          <RegisterMentorDialog
            isOpen={isRegistrationOpen}
            isPending={isRegistrationPending}
            onOpenChange={onRegistrationOpenChange}
            onRegister={onRegister}
          />
        </div>
      </div>
    </div>
  );
}
