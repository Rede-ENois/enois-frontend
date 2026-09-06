import { texts } from "@/texts";

import { MentorCard } from "./mentor-card";
import type { MentorViewModel } from "./mentor-view-model";

type MentorsListProps = {
  mentors: MentorViewModel[];
};

export function MentorsList({ mentors }: MentorsListProps) {
  return (
    <div id="mentores-lista">
      <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>
      <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {mentors.map((mentorViewModel) => (
          <MentorCard key={mentorViewModel.mentor.id} {...mentorViewModel} />
        ))}
      </div>
    </div>
  );
}
