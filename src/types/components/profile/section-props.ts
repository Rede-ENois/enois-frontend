import type { ElementType } from "react";

import type { WithRequiredChildren } from "@/types/components/with-required-children";

export type SectionProps = WithRequiredChildren<{
  title: string;
  icon?: ElementType;
}>;
