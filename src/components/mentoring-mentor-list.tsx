import { texts } from "@/texts";
import { useMentoringPageContext } from "@/utils/components/mentoring/use-mentoring-page-context";

import { MentorCardProvider } from "@/components/mentor-card-provider";

export function MentoringMentorList() {
  const { mentors } = useMentoringPageContext();

  return (
    <section id="mentores-lista">
      <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>

      <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {mentors.map((mentor) => (
          <MentorCardProvider key={mentor.id} mentor={mentor} />
        ))}
      </div>
    </section>
  );
}
