import * as SheetPrimitive from "@radix-ui/react-dialog";
import type { ComponentPropsWithoutRef } from "react";

export type SheetContentProps = ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & {
  side?: "top" | "bottom" | "left" | "right" | null;
  overlayClassName?: string;
};
