import { Loader2 } from "lucide-react";

type JobLoadingProps = {
  isVisible: boolean;
};

export function JobLoading({ isVisible }: JobLoadingProps) {
  return isVisible ? (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ) : null;
}
