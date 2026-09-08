import type { ChangeEventHandler, RefObject } from "react";

export type ProfileHeaderMediaEditControlsProps = {
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
  overlayClassName: string;
  iconClassName: string;
};
