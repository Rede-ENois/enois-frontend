import { cn } from "@/lib/utils";
import type { FormFieldProps } from "@/types/components/form-field-props";

import { Label } from "@/components/ui/label";

export function FormField({ label, error, right, labelClassName, children }: FormFieldProps) {
  const labelElement = (
    <Label className={cn("text-sm font-medium", labelClassName)}>{label}</Label>
  );

  return (
    <div className="space-y-1.5">
      {right ? (
        <div className="flex items-center justify-between">
          {labelElement}
          {right}
        </div>
      ) : (
        labelElement
      )}
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
