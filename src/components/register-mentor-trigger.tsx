import { texts } from "@/texts";

import { Button } from "@/components/ui/button";

export function RegisterMentorTrigger() {
  return (
    <Button variant="outline" className="rounded-full">
      {texts.mentoring.becomeMentor}
    </Button>
  );
}
