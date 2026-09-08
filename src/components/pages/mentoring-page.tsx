import { AppContainer } from "@/components/app-container";
import { MentoringHero } from "@/components/mentoring-hero";
import { MentoringMentorList } from "@/components/mentoring-mentor-list";

export function Mentoria() {
  return (
    <AppContainer>
      <div className="space-y-6">
        <MentoringHero />
        <MentoringMentorList />
      </div>
    </AppContainer>
  );
}
