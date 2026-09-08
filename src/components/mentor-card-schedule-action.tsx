import { texts } from "@/texts";
import type { MentorCardScheduleActionProps } from "@/types/components/mentoring/mentor-card-schedule-action-props";

import { Button } from "@/components/ui/button";

export function MentorCardScheduleAction({ visible }: MentorCardScheduleActionProps) {
  return (
    <div className="flex flex-col gap-4 text-[13px] md:col-span-3">
      {visible && (
        <Button className="shrink-0 self-center rounded-lg bg-mentorship-button px-[14px] py-2">
          {texts.mentoring.schedule}
        </Button>
      )}
    </div>
  );
}
