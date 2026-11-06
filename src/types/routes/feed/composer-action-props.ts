import type { ComponentPropsWithoutRef, ElementType } from "react";

export type ComposerActionProps = {
  icon: ElementType;
  label: string;
  active?: boolean;
  onClick: NonNullable<ComponentPropsWithoutRef<"button">["onClick"]>;
};
