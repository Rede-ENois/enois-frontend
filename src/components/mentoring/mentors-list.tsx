import { texts } from "@/texts";

import { MentorCard } from "./mentor-card";
import type { MentorListItem } from "./mentor-list-item";

export function MentorsList({ items }: { items: MentorListItem[] }) {
  return (
    <div id="mentores-lista">
      <h2 className="text-lg font-semibold">{texts.mentoring.featured}</h2>
      <p className="text-sm text-muted-foreground">{texts.mentoring.featuredDescription}</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <MentorCard key={item.mentor.id} {...item} />
        ))}
      </div>
    </div>
  );
}
