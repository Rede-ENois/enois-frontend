import type { ComponentPropsWithoutRef } from "react";

import type { WithRequiredChildren } from "@/types/components/with-required-children";

export type TabButtonProps = WithRequiredChildren<{
  active: boolean;
  variant: "auth" | "feed";
  onClick: NonNullable<ComponentPropsWithoutRef<"button">["onClick"]>;
}>;
