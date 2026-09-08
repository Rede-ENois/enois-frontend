import { MentorCardExpertise } from "@/components/mentor-card-expertise";
import { MentorCardHeader } from "@/components/mentor-card-header";
import { MentorCardStats } from "@/components/mentor-card-stats";

export function MentorCard() {
  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
      <MentorCardHeader />
      <MentorCardExpertise />
      <MentorCardStats />
    </article>
  );
}
