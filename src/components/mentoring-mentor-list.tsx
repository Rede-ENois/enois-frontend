import { texts } from "@/texts";
import type { MentoringMentorListProps } from "@/types/components/mentoring/mentoring-mentor-list-props";

import { MentorCard } from "@/components/mentor-card";

export function MentoringMentorList({ mentors }: MentoringMentorListProps) {
  return (
    <section id="mentores-lista">
      <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>

      <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {mentors.map((mentor) => (
          <MentorCard key={mentor.id} mentor={mentor} />
        ))}
      </div>
    </section>
  );
}
