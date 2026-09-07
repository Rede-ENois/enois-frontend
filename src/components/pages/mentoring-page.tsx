import { useQuery } from "@tanstack/react-query";

import { texts } from "@/texts";
import { Sparkles } from "lucide-react";

import { listMentors } from "@/lib/api/mentors";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { AppContainer } from "@/components/app-container";
import { MentorCard } from "@/components/mentor-card";
import { RegisterMentorDialog } from "@/components/register-mentor-dialog";

export function Mentoria() {
  const { data: mentorsData } = useQuery({
    queryKey: ["mentors"],
    queryFn: () => listMentors(),
  });
  const mentors = mentorsData?.items ?? [];

  return (
    <AppContainer>
      <div className="space-y-6">
        <div
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
              <Button
                className="rounded-full"
                onClick={() => {
                  document.getElementById("mentores-lista")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {texts.mentoring.findMentor}
              </Button>

              <RegisterMentorDialog />
            </div>
          </div>
        </div>

        <div id="mentores-lista">
          <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>

          <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {mentors.map((mentor) => (
              <MentorCard key={mentor.id} mentor={mentor} />
            ))}
          </div>
        </div>
      </div>
    </AppContainer>
  );
}
