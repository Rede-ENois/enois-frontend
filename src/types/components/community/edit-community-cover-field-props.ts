import type { ChangeEventHandler, RefObject } from "react";

export type EditCommunityCoverFieldProps = {
  cover: string;
  inputRef: RefObject<HTMLInputElement | null>;
  onSelect: ChangeEventHandler<HTMLInputElement>;
  onRemove: () => void;
};
