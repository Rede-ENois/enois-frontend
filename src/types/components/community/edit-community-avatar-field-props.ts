import type { ChangeEventHandler, RefObject } from "react";

export type EditCommunityAvatarFieldProps = {
  avatar: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onSelect: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
};
