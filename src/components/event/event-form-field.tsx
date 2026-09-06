import type { FormFieldProps } from "@/types/components/shared/form-field-props";

import { Label } from "@/components/ui/label";

export function EventFormField({ label, children }: FormFieldProps) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
