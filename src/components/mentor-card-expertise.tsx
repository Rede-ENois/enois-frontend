import type { MentorCardExpertiseProps } from "@/types/components/mentoring/mentor-card-expertise-props";

import { Badge } from "@/components/ui/badge";

export function MentorCardExpertise({ expertise }: MentorCardExpertiseProps) {
  return (
    <section>
      {expertise.map((item) => (
        <Badge
          key={item}
          variant="secondary"
          className="rounded-full bg-accent font-normal text-accent-foreground"
        >
          {item}
        </Badge>
      ))}
    </section>
  );
}
