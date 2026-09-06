import type { ReactNode } from "react";

import type { WithRequiredChildren } from "@/types/components/with-required-children";

export type FormFieldProps = WithRequiredChildren<{
  label: string;
  error?: string;
  right?: ReactNode;
  labelClassName?: string;
}>;
