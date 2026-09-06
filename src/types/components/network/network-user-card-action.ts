import type { ElementType } from "react";

export type NetworkUserCardAction = {
  Icon: ElementType;
  label: string;
  variant: "default" | "outline";
  className: string;
  run: () => void;
};
