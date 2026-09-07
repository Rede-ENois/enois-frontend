import { texts } from "@/texts";

import { LegalSection } from "@/components/legal-section";

export function PrivacySections() {
  const { whoWeAre, collectedData, other } = texts.legal.privacy.sections;

  return (
    <>
      <LegalSection title={whoWeAre.title}>
        {whoWeAre.paragraphs.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </LegalSection>

      <LegalSection title={collectedData.title}>
        <p>{collectedData.intro}</p>

        <p>
          <strong>{collectedData.providedLabel}</strong>

          <>{` ${collectedData.providedBody}`}</>
        </p>

        <p>
          <strong>{collectedData.usageLabel}</strong>

          <>{` ${collectedData.usageBody}`}</>
        </p>

        <p>
          <strong>{collectedData.technicalLabel}</strong>

          <>{` ${collectedData.technicalBody}`}</>
        </p>
      </LegalSection>

      {other.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </LegalSection>
      ))}
    </>
  );
}
