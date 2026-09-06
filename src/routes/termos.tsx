import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { LegalLastUpdated } from "@/components/legal-last-updated";
import { LegalLayout } from "@/components/legal-layout";
import { LegalSection } from "@/components/legal-section";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: texts.legal.terms.seoTitle },
      {
        name: "description",
        content:
          texts.legal.terms.seoDescription,
      },
    ],
  }),
  component: Termos,
});

function Termos() {
  const [
    acceptance,
    definitions,
    registration,
    conduct,
    publishedContent,
    jobs,
    thirdParty,
    availability,
    liability,
    termination,
    law,
    contact,
  ] = texts.legal.terms.sections;

  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.legal.terms.title}</h1>
        <LegalLastUpdated date={texts.legal.updatedAt} />
      </header>

      <LegalSection title={acceptance.title}>
        <p>{acceptance.text}</p>
      </LegalSection>

      <LegalSection title={definitions.title}>
        <p>{definitions.text}</p>
      </LegalSection>

      <LegalSection title={registration.title}>
        <p>{registration.text}</p>
      </LegalSection>

      <LegalSection title={conduct.title}>
        <p>{conduct.text}</p>
      </LegalSection>

      <LegalSection title={publishedContent.title}>
        <p>{publishedContent.text}</p>
      </LegalSection>

      <LegalSection title={jobs.title}>
        <p>{jobs.text}</p>
      </LegalSection>

      <LegalSection title={thirdParty.title}>
        <p>{thirdParty.text}</p>
      </LegalSection>

      <LegalSection title={availability.title}>
        <p>{availability.text}</p>
      </LegalSection>

      <LegalSection title={liability.title}>
        <p>{liability.text}</p>
      </LegalSection>

      <LegalSection title={termination.title}>
        <p>{termination.text}</p>
      </LegalSection>

      <LegalSection title={law.title}>
        <p>{law.text}</p>
      </LegalSection>

      <LegalSection title={contact.title}>
        <p>{contact.text}</p>
      </LegalSection>

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
