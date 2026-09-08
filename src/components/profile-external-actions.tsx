import { MessageCircle } from "lucide-react";

import { texts } from "@/texts";
import type { ProfileExternalActionsProps } from "@/types/components/profile/profile-external-actions-props";
import type { ProfileHeaderAction } from "@/types/components/profile/profile-header-action";

import { ProfileHeaderActionButton } from "@/components/profile-header-action-button";

export function ProfileExternalActions({ message, connectionAction }: ProfileExternalActionsProps) {
  const actions: ProfileHeaderAction[] = [
    {
      key: "message",
      label: texts.profile.message,
      icon: MessageCircle,
      variant: "outline",
      onClick: message,
      disabled: false,
    },
    {
      key: "connection",
      label: connectionAction.label,
      icon: null,
      variant: "default",
      onClick: connectionAction.run,
      disabled: connectionAction.disabled,
    },
  ];

  return (
    <>
      {actions.map((action) => (
        <ProfileHeaderActionButton key={action.key} action={action} />
      ))}
    </>
  );
}
