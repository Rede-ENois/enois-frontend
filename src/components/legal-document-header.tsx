import { texts } from "@/texts";
import type { LegalDocumentHeaderProps } from "@/types/components/legal/legal-document-header-props";

import { LegalLastUpdated } from "@/components/legal-last-updated";

export function LegalDocumentHeader({ title }: LegalDocumentHeaderProps) {
  return (
    <header className="space-y-2">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>

      <LegalLastUpdated date={texts.legal.updatedAt} />
    </header>
  );
}
