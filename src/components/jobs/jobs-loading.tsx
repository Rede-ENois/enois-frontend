import { Loader2 } from "lucide-react";

export function JobsLoading({ visible }: { visible: boolean }) {
  return visible ? (
    <div className="flex justify-center py-6">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  ) : null;
}
