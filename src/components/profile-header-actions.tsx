import { MessageCircle, Settings } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileHeaderActionsProps } from "@/types/components/profile/profile-header-actions-props";

import { Button } from "@/components/ui/button";

import { EditProfileDialog } from "@/components/edit-profile-dialog";

export function ProfileHeaderActions({
  profile,
  showEditAction,
  showExternalActions,
  message,
  connectionAction,
}: ProfileHeaderActionsProps) {
  const externalActions = [
    {
      key: "message",
      label: texts.profile.message,
      icon: MessageCircle,
      variant: "outline" as const,
      onClick: message,
      disabled: false,
    },
    {
      key: "connection",
      label: connectionAction.label,
      icon: null,
      variant: "default" as const,
      onClick: connectionAction.run,
      disabled: connectionAction.disabled,
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {showEditAction && (
        <EditProfileDialog profile={profile}>
          <Button variant="outline" size="sm" className="rounded-full gap-1.5">
            <Settings className="h-4 w-4" />

            <>{texts.profile.editProfile}</>
          </Button>
        </EditProfileDialog>
      )}

      {showExternalActions &&
        externalActions.map((action) => (
          <Button
            key={action.key}
            variant={action.variant}
            size="sm"
            className="rounded-full gap-1.5"
            onClick={action.onClick}
            disabled={action.disabled}
          >
            {action.icon && <action.icon className="h-4 w-4" />}

            <>{action.label}</>
          </Button>
        ))}
    </div>
  );
}
