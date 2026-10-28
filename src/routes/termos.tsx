import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { LegalLastUpdated, LegalSection } from "@rede-enois/design-system/domain";

import { ogMetas } from "@/lib/seo";

import { LegalLayout } from "@/components/legal-layout";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [
      { title: texts.legal.terms.seoTitle },
      {
        name: "description",
        content: texts.legal.terms.seoDescription,
      },
      ...ogMetas(texts.legal.terms.seoTitle, texts.legal.terms.seoDescription),
    ],
  }),
  component: Termos,
});

function Termos() {
  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.legal.terms.title}</h1>

        <LegalLastUpdated date={texts.legal.updatedAt} />
      </header>

      {texts.legal.terms.sections.map((section) => (
        <LegalSection key={section.title} title={section.title}>
          {section.text.split("\n\n").map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </LegalSection>
      ))}

      <footer className="border-t border-border pt-6 text-sm">
        <p>
          <>{texts.legal.footer.backPrefix}</>

          <Link to="/" className="text-primary hover:underline">
            {texts.legal.footer.home}
          </Link>
        </p>
      </footer>
    </LegalLayout>
  );
}
