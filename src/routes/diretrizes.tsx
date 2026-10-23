import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";

import { ogMetas } from "@/lib/seo";

import { LegalLayout, LegalSection } from "@/components/legal-layout";

export const Route = createFileRoute("/diretrizes")({
  // Pagina PUBLICA: vale para quem denuncia e para quem foi denunciado.
  head: () => ({
    meta: [
      { title: texts.guidelines.seoTitle },
      { name: "description", content: texts.guidelines.seoDescription },
      ...ogMetas(texts.guidelines.seoTitle, texts.guidelines.seoDescription),
    ],
  }),
  component: Diretrizes,
});

function Diretrizes() {
  return (
    <LegalLayout>
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">{texts.guidelines.title}</h1>

        <p className="text-sm text-text-subtle">{texts.guidelines.intro}</p>
      </header>

      <LegalSection title={texts.guidelines.welcomeTitle}>
        <ul className="list-disc space-y-1.5 pl-5">
          {texts.guidelines.welcome.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={texts.guidelines.zeroToleranceTitle}>
        <p>{texts.guidelines.zeroToleranceIntro}</p>

        <ul className="list-disc space-y-1.5 pl-5 font-medium">
          {texts.guidelines.zeroTolerance.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={texts.guidelines.notWelcomeTitle}>
        <ul className="list-disc space-y-1.5 pl-5">
          {texts.guidelines.notWelcome.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={texts.guidelines.reportsTitle}>
        <ul className="list-disc space-y-1.5 pl-5">
          {texts.guidelines.reports.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={texts.guidelines.penaltiesTitle}>
        <ul className="list-disc space-y-1.5 pl-5">
          {texts.guidelines.penalties.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </LegalSection>

      <LegalSection title={texts.guidelines.appealsTitle}>
        <p>
          {texts.guidelines.appeals}

          <>{` `}</>

          <Link to="/suporte" className="text-primary hover:underline">
            {texts.support.title}
          </Link>
        </p>
      </LegalSection>

      <footer className="border-t border-border pt-6 text-sm">
        <p>
          <Link to="/" className="text-primary hover:underline">
            {texts.legal.footer.home}
          </Link>
        </p>
      </footer>
    </LegalLayout>
  );
}
