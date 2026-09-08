import { MentoringPageContext } from "@/utils/components/mentoring/mentoring-page-context";
import { useMentoringPageController } from "@/utils/components/mentoring/use-mentoring-page-controller";

import { Mentoria } from "@/components/pages/mentoring-page";

export function MentoringPageProvider() {
  const controller = useMentoringPageController();

  return (
    <MentoringPageContext.Provider value={controller}>
      <Mentoria />
    </MentoringPageContext.Provider>
  );
}
