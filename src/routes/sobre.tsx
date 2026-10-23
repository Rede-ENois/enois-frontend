import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft } from "lucide-react";

import { ogMetas } from "@/lib/seo";

import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/sobre")({
  // Página pública: é a identidade do projeto, inclusive para quem chega de fora.
  head: () => ({
    meta: [
      { title: texts.about.seoTitle },
      { name: "description", content: texts.about.seoDescription },
      ...ogMetas(texts.about.seoTitle, texts.about.seoDescription),
    ],
  }),
  component: Sobre,
});

function Sobre() {
  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.about.title}</h1>

        <p className="text-sm text-text-subtle">{texts.about.intro}</p>
      </header>

      <LegalSection title={texts.about.independenceTitle}>
        <p>{texts.about.disclaimer}</p>

        <p>
          {texts.about.contact}

          <>{` `}</>

          <Link to="/contato" className="text-primary hover:underline">
            {texts.landing.footer.contact}
          </Link>
        </p>
      </LegalSection>

      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />

        <>{texts.about.back}</>
      </Link>
    </LegalLayout>
  );
}
