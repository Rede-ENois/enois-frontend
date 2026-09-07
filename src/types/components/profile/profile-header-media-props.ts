import type { ChangeEventHandler, RefObject } from "react";

export type ProfileHeaderMediaProps = {
  imageUrl?: string | null;
  alt?: string | null;
  area: {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
  overlay: {
    visible: boolean;
    disabled: boolean;
    label: string | null;
    openFilePicker: () => void;
  };
  input: {
    ref: RefObject<HTMLInputElement | null>;
    onChange: ChangeEventHandler<HTMLInputElement>;
  };
};
