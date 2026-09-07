import type { UserAvatarProps } from "@/types/components/user-avatar/user-avatar-props";

import { createUserAvatarViewModel } from "@/utils/components/user-avatar/create-user-avatar-view-model";

import { Avatar } from "@/components/ui/avatar";

export function UserAvatar(props: UserAvatarProps) {
  const { className } = props;
  const { label, resolvedSrc, fallbackText, fallbackClassName } = createUserAvatarViewModel(props);

  return (
    <Avatar type="root" className={className}>
      {resolvedSrc && <Avatar type="image" src={resolvedSrc} alt={label} />}
      <Avatar type="fallback" className={fallbackClassName}>
        {fallbackText}
      </Avatar>
    </Avatar>
  );
}
