import type { ChangeEventHandler, ComponentPropsWithoutRef } from "react";

export type SubListEditorFieldProps = {
  fieldKey: string;
  label: string;
  multiline: boolean;
  type: ComponentPropsWithoutRef<"input">["type"];
  value: string;
  onChange: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};
