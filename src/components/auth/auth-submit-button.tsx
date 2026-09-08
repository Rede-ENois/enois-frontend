import type { AuthSubmitButtonProps } from "@/types/auth/auth-submit-button-props";
import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AuthSubmitButton({ loading, label }: AuthSubmitButtonProps) {
  return (
    <Button type="submit" className="w-full rounded-full gap-2" disabled={loading}>
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <>{label} </>

          <ArrowRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
