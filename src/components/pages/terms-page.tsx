import { texts } from "@/texts";

import { LegalDocumentFooter } from "@/components/legal-document-footer";
import { LegalDocumentHeader } from "@/components/legal-document-header";
import { LegalLayout } from "@/components/legal-layout";
import { TermsSections } from "@/components/terms-sections";

export function Termos() {
  return (
    <LegalLayout>
      <LegalDocumentHeader title={texts.legal.terms.title} />
      <TermsSections />
      <LegalDocumentFooter />
    </LegalLayout>
  );
}
