import { texts } from "@/texts";
import { ThumbsUp } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ProfileRecommendationTrigger() {
  return (
    <Button size="sm" className="w-full rounded-full gap-1.5">
      <ThumbsUp className="h-4 w-4" />

      <>{texts.profile.recommendAction}</>
    </Button>
  );
}
