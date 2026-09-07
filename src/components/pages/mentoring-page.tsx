import { useMentoringPageController } from "@/utils/components/mentoring/use-mentoring-page-controller";

import { AppContainer } from "@/components/app-container";
import { MentoringHero } from "@/components/mentoring-hero";
import { MentoringMentorList } from "@/components/mentoring-mentor-list";

export function Mentoria() {
  const { mentors, scrollToMentors } = useMentoringPageController();

  return (
    <AppContainer>
      <div className="space-y-6">
        <MentoringHero onFindMentor={scrollToMentors} />
        <MentoringMentorList mentors={mentors} />
      </div>
    </AppContainer>
  );
}
