import { texts } from "@/texts";
import { useMentorCardContext } from "@/utils/components/mentoring/use-mentor-card-context";

import { Button } from "@/components/ui/button";

export function MentorCardScheduleAction() {
  const { isOwner } = useMentorCardContext();

  return (
    <div className="flex flex-col gap-4 text-[13px] md:col-span-3">
      {!isOwner && (
        <Button className="shrink-0 self-center rounded-lg bg-mentorship-button px-[14px] py-2">
          {texts.mentoring.schedule}
        </Button>
      )}
    </div>
  );
}
