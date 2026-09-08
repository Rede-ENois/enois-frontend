import { texts } from "@/texts";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";
import { Camera } from "lucide-react";

export function createCommunityImageActions({
  inputRef,
  onRemove,
}: Pick<CommunityImageFieldProps, "inputRef" | "onRemove">) {
  return [
    {
      key: "change",
      variant: "outline" as const,
      className: "rounded-full gap-1.5",
      onClick: () => inputRef.current?.click(),
      icon: Camera,
      label: texts.communities.detail.change,
    },
    {
      key: "remove",
      variant: "destructive" as const,
      className: "rounded-full",
      onClick: onRemove,
      icon: null,
      label: texts.communities.detail.remove,
    },
  ];
}
