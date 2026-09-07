import { texts } from "@/texts";
import type { CommunityImageFieldProps } from "@/types/components/communities/community-image-field-props";
import { Camera } from "lucide-react";

import { Button } from "@/components/ui/button";

export function CommunityImageActions({
  inputRef,
  onRemove,
}: Pick<CommunityImageFieldProps, "inputRef" | "onRemove">) {
  const actions = [
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

  return (
    <>
      {actions.map((action) => (
        <Button
          key={action.key}
          type="button"
          variant={action.variant}
          size="sm"
          className={action.className}
          onClick={action.onClick}
        >
          {action.icon && <action.icon className="h-4 w-4" />}

          <>{action.label}</>
        </Button>
      ))}
    </>
  );
}
