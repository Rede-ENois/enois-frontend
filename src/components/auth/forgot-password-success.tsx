import { texts } from "@/texts";
import type { ForgotPasswordSuccessProps } from "@/types/components/auth/forgot-password-success-props";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

export function ForgotPasswordSuccess({ onClose }: ForgotPasswordSuccessProps) {
  return (
    <div className="space-y-4 pb-2 pt-2">
      <div className="flex items-start gap-3 rounded-xl bg-primary/10 p-4">
        <MailCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />

        <div>
          <p className="text-sm font-medium">{texts.auth.forgot.checkEmail}</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {texts.auth.forgot.sentDescription}
          </p>
        </div>
      </div>

      <Button className="w-full rounded-full" onClick={onClose}>
        {texts.auth.forgot.understood}
      </Button>
    </div>
  );
}
