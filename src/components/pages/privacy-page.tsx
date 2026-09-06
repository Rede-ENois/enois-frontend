import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";

import { LegalLastUpdated } from "@/components/legal-last-updated";
import { LegalLayout } from "@/components/legal-layout";
import { LegalSection } from "@/components/legal-section";

export function Privacidade() {
  const { whoWeAre, collectedData, other } = texts.legal.privacy.sections;
  const [legalBasis, sharing, storage, retention, rights, cookies, minors, contact, changes] = other;

  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.legal.privacy.title}</h1>
        <LegalLastUpdated date={texts.legal.updatedAt} />
      </header>

      <LegalSection title={whoWeAre.title}>
        <p>{whoWeAre.paragraphs[0]}</p>
      </LegalSection>

      <LegalSection title={collectedData.title}>
        <p>{collectedData.intro}</p>
        <p>
          <strong>{collectedData.providedLabel}</strong><>{` ${collectedData.providedBody}`}</>
        </p>
        <p>
          <strong>{collectedData.usageLabel}</strong><>{` ${collectedData.usageBody}`}</>
        </p>
        <p>
          <strong>{collectedData.technicalLabel}</strong><>{` ${collectedData.technicalBody}`}</>
        </p>
      </LegalSection>

      <LegalSection title={legalBasis.title}>
        <p>{legalBasis.paragraphs[0]}</p>
        <p>{legalBasis.paragraphs[1]}</p>
      </LegalSection>

      <LegalSection title={sharing.title}><p>{sharing.paragraphs[0]}</p></LegalSection>
      <LegalSection title={storage.title}><p>{storage.paragraphs[0]}</p></LegalSection>
      <LegalSection title={retention.title}><p>{retention.paragraphs[0]}</p></LegalSection>
      <LegalSection title={rights.title}>
        <p>{rights.paragraphs[0]}</p>
        <p>{rights.paragraphs[1]}</p>
      </LegalSection>
      <LegalSection title={cookies.title}><p>{cookies.paragraphs[0]}</p></LegalSection>
      <LegalSection title={minors.title}><p>{minors.paragraphs[0]}</p></LegalSection>
      <LegalSection title={contact.title}><p>{contact.paragraphs[0]}</p></LegalSection>
      <LegalSection title={changes.title}><p>{changes.paragraphs[0]}</p></LegalSection>

      <footer className="border-t border-border pt-6 text-sm">
        <p>
          <>{texts.legal.footer.backPrefix}</><Link to="/" className="text-primary hover:underline">
            {texts.legal.footer.home}
          </Link>
        </p>
      </footer>
    </LegalLayout>
  );
}
