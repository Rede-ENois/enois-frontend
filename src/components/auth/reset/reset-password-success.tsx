import { ArrowRight, CheckCircle2 } from "lucide-react";

import { texts } from "@/texts";
import type { ResetPasswordSuccessProps } from "@/types/components/auth/reset-password-success-props";
import { Button } from "@/components/ui/button";

export function ResetPasswordSuccess({ onContinue }: ResetPasswordSuccessProps) {
  return (
    <div className="text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">{texts.auth.reset.successTitle}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{texts.auth.reset.successDescription}</p>
      <Button className="mt-6 w-full gap-2 rounded-full" onClick={onContinue}>
        {texts.auth.reset.enterNow} <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
