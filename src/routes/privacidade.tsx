import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { LegalLastUpdated } from "@/components/legal/legal-last-updated";
import { LegalLayout } from "@/components/legal/legal-layout";
import { LegalSection } from "@/components/legal/legal-section";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: texts.legal.privacy.seoTitle },
      { name: "description", content: texts.legal.privacy.seoDescription },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { whoWeAre, collectedData, other: additionalSections } = texts.legal.privacy.sections;

  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.legal.privacy.title}</h1>
        <LegalLastUpdated date={texts.legal.updatedAt} />
      </header>

      <LegalSection title={whoWeAre.title}>
        {whoWeAre.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </LegalSection>

      <LegalSection title={collectedData.title}>
        <p>{collectedData.intro}</p>
        <p><strong>{collectedData.providedLabel}</strong> {collectedData.providedBody}</p>
        <p><strong>{collectedData.usageLabel}</strong> {collectedData.usageBody}</p>
        <p><strong>{collectedData.technicalLabel}</strong> {collectedData.technicalBody}</p>
      </LegalSection>

      {additionalSections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        </LegalSection>
      ))}

      <footer className="border-t border-border pt-6 text-sm">
        <p>
          {texts.legal.footer.backPrefix}{" "}
          <Link to="/" className="text-primary hover:underline">{texts.legal.footer.home}</Link>
        </p>
      </footer>
    </LegalLayout>
  );
}
