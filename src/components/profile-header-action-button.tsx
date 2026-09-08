import type { ProfileHeaderActionButtonProps } from "@/types/components/profile/profile-header-action-button-props";

import { Button } from "@/components/ui/button";

export function ProfileHeaderActionButton({ action }: ProfileHeaderActionButtonProps) {
  const Icon = action.icon;

  return (
    <Button
      variant={action.variant}
      size="sm"
      className="rounded-full gap-1.5"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {Icon && <Icon className="h-4 w-4" />}
      <>{action.label}</>
    </Button>
  );
}
