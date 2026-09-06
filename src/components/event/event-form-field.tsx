import type { EventFormFieldProps } from "@/types/components/event/event-form-field-props";

import { Label } from "@/components/ui/label";

export function EventFormField({ label, children }: EventFormFieldProps) {
  return <div className="space-y-1.5"><Label className="text-xs font-medium text-muted-foreground">{label}</Label>{children}</div>;
}
