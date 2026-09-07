import { texts } from "@/texts";
import type { LegalLastUpdatedProps } from "@/types/components/legal/legal-last-updated-props";

export function LegalLastUpdated({ date }: LegalLastUpdatedProps) {
  return (
    <p className="text-xs text-muted-foreground">
      <>{texts.legal.footer.lastUpdated}</>

      <time dateTime={date}>{date}</time>
    </p>
  );
}
