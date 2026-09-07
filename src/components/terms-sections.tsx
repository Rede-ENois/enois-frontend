import { texts } from "@/texts";

import { LegalSection } from "@/components/legal-section";

export function TermsSections() {
  return (
    <>
      {texts.legal.terms.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          <p>{section.text}</p>
        </LegalSection>
      ))}
    </>
  );
}
