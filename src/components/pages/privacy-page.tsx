import { texts } from "@/texts";

import { LegalDocumentFooter } from "@/components/legal-document-footer";
import { LegalDocumentHeader } from "@/components/legal-document-header";
import { LegalLayout } from "@/components/legal-layout";
import { PrivacySections } from "@/components/privacy-sections";

export function Privacidade() {
  return (
    <LegalLayout>
      <LegalDocumentHeader title={texts.legal.privacy.title} />
      <PrivacySections />
      <LegalDocumentFooter />
    </LegalLayout>
  );
}
