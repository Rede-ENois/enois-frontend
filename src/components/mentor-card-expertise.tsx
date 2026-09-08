import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { Badge } from "@/components/ui/badge";

export function MentorCardExpertise() {
  const { mentor } = useMentorCardContext();

  return (
    <section>
      {mentor.expertise.map((item) => (
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
