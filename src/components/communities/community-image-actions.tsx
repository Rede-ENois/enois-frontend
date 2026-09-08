import type { CommunityImageFieldProps } from "@/types/communities/community-image-field-props";
import { createCommunityImageActions } from "@/utils/communities/create-community-image-actions";

import { Button } from "@/components/ui/button";

export function CommunityImageActions(
  props: Pick<CommunityImageFieldProps, "inputRef" | "onRemove">,
) {
  const actions = createCommunityImageActions(props);

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
