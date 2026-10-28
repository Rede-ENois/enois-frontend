import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { Button, GithubIcon } from "@rede-enois/design-system/ui";
import { ArrowRight, Award, GitPullRequest, ShieldCheck } from "lucide-react";

import { contributorSealsApi } from "@/lib/api";
import { ogMetas } from "@/lib/seo";

import { AppContainer } from "@/components/app-container";
import { ContributorLinkStatus } from "@/components/contributor-link-status";
import { VerifiedContributorPrompt } from "@/components/verified-contributor-prompt";

export const Route = createFileRoute("/selos")({
  head: () => ({
    meta: [
      { title: texts.sealsPage.seoTitle },
      { name: "description", content: texts.sealsPage.seoDescription },
      ...ogMetas(texts.sealsPage.seoTitle, texts.sealsPage.seoDescription),
    ],
  }),
  component: Selos,
});

const CATEGORY_HINTS = texts.sealsPage.categories as Record<string, string>;

/**
 * Critérios públicos dos selos. A página lê categorias, faixas e repositórios da API (fonte
 * única) — o front não calcula nível nem promete categoria sem critério implementado.
 */
function Selos() {
  const { data } = useQuery({
    queryKey: ["seal-criteria"],
    queryFn: () => contributorSealsApi.criteria(),
    staleTime: 10 * 60_000,
    retry: false,
  });

  const categories = data?.categories ?? [];
  const policies = data?.policies ?? texts.sealsPage.criteria;
  const repositories = data?.repositories ?? [];

  return (
    <div className="min-h-screen bg-background">
      <AppContainer>
        <div className="mx-auto max-w-3xl space-y-8 py-10 sm:py-14">
          <header className="space-y-3">
            <Link to="/" className="text-xs font-medium text-primary hover:underline">
              {texts.profile.backHome}
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Award className="h-4 w-4" aria-hidden />
              {texts.sealsPage.title}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {texts.sealsPage.title}
            </h1>

            <p className="text-base leading-relaxed text-muted-foreground">
              {texts.sealsPage.intro}
            </p>
          </header>

          <VerifiedContributorPrompt showConfirmed />
          <ContributorLinkStatus />

          <section className="space-y-3">
            <h2 className="text-lg font-semibold tracking-tight">
              {texts.sealsPage.categoriesTitle}
            </h2>

            {categories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{texts.sealsPage.categoriesEmpty}</p>
            ) : (
              categories.map((category) => (
                <div key={category.category} className="surface-card space-y-3 p-5">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-text-strong">{category.name}</h3>

                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>

                    {CATEGORY_HINTS[category.category] && (
                      <p className="text-xs text-text-subtle">
                        {CATEGORY_HINTS[category.category]}
                      </p>
                    )}
                  </div>

                  <ul className="divide-y divide-border-soft">
                    {category.tiers.map((tier) => (
                      <li
                        key={tier.type}
                        className="flex flex-wrap items-start justify-between gap-2 py-2 first:pt-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-text-strong">{tier.name}</p>

                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {tier.description}
                          </p>
                        </div>

                        <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-text">
                          {texts.sealsPage.tierRange(tier.minCount, tier.maxCount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </section>

          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              {texts.sealsPage.criteriaTitle}
            </h2>

            <ul className="space-y-2">
              {policies.map((item) => (
                <li key={item} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <GitPullRequest className="h-5 w-5 text-primary" aria-hidden />
              {texts.sealsPage.reposTitle}
            </h2>

            {repositories.length === 0 ? (
              <p className="text-sm text-muted-foreground">{texts.sealsPage.reposEmpty}</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {repositories.map((repo) => (
                  <li key={repo}>
                    <a
                      href={`https://github.com/${repo}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border-soft px-3 py-1 text-xs font-medium text-text-strong hover:border-primary/50 hover:text-primary"
                    >
                      <GithubIcon className="h-3.5 w-3.5" />
                      {repo}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.linkTitle}</h2>

            <ol className="space-y-2">
              {texts.sealsPage.linkSteps.map((step, index) => (
                <li key={step} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                    {index + 1}
                  </span>

                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.statesTitle}</h2>

            <dl className="space-y-1.5 text-sm leading-relaxed text-muted-foreground">
              {Object.entries(texts.sealsPage.states).map(([state, description]) => (
                <div key={state} className="flex gap-2">
                  <dt className="w-24 shrink-0 font-mono text-xs text-text-subtle">{state}</dt>

                  <dd>{description}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="surface-card space-y-2 p-5">
            <h2 className="text-lg font-semibold tracking-tight">{texts.sealsPage.privacyTitle}</h2>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {texts.sealsPage.privacy}
            </p>
          </section>

          <footer className="flex flex-col items-start gap-2 border-t border-border pt-6">
            <Button asChild className="gap-2 rounded-full">
              <Link to="/seguranca">
                {texts.sealsPage.cta}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>

            <p className="text-xs text-text-subtle">{texts.sealsPage.ctaHint}</p>
          </footer>
        </div>
      </AppContainer>
    </div>
  );
}
