import { Label } from "@/components/ui/label";
import type { AuthFieldProps } from "@/types/components/auth/auth-field-props";

export function AuthField({ label, error, right, children }: AuthFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {right}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
