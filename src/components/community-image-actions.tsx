import { Camera } from "lucide-react";

import { texts } from "@/texts";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";

import { Button } from "@/components/ui/button";

export function CommunityImageActions({
  inputRef,
  onRemove,
}: Pick<CommunityImageFieldProps, "inputRef" | "onRemove">) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-full gap-1.5"
        onClick={() => inputRef.current?.click()}
      >
        <Camera className="h-4 w-4" /><>{texts.communities.detail.change}</>
      </Button>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        className="rounded-full"
        onClick={onRemove}
      >
        {texts.communities.detail.remove}
      </Button>
    </>
  );
}
