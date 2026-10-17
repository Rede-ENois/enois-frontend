import { useEffect } from "react";

import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";

import { statsApi } from "@/lib/api";
import { buildPageShareTags } from "@/lib/open-graph";

import { Button } from "@/components/ui/button";

import { ThemeToggle } from "@/components/theme-toggle";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: buildPageShareTags({ path: "/" }),
  }),
  component: Landing,
});

/**
 * Porta de entrada do énóis.
 *
 * Ordem pensada para quem nunca ouviu falar do projeto: a tese (hero), quem já está aqui (números
 * da comunidade, em destaque), o problema que o modelo dominante cria, os princípios que viram
 * decisão de produto, o que já existe de verdade (com captura real de uma página pública) e o
 * convite final. Nada de promessa que o produto não cumpre — ver `texts.landing`.
 */
function Landing() {
  // Contador de usuários ativos: o cache do servidor manda (frescor de ~10 min), então o front
  // guarda o valor pelo mesmo tempo em vez de reperguntar a cada navegação.
  const { data: stats } = useQuery({
    queryKey: ["stats", "community"],
    queryFn: () => statsApi.community(),
    staleTime: 10 * 60_000,
    retry: 1,
  });

  useHashScroll();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label={texts.brand.name}>
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg text-primary-foreground"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Sparkles className="h-3.5 w-3.5" />
            </span>

            <span className="text-base font-semibold tracking-tight">
              {texts.brand.prefix}

              <span className="gradient-text">{texts.brand.accent}</span>
            </span>
          </Link>

          <nav
            aria-label={texts.brand.name}
            className="hidden items-center gap-6 text-sm text-muted-foreground md:flex"
          >
            {pageAnchors.map((anchor) => (
              <a
                key={anchor.href}
                href={anchor.href}
                className="transition-colors hover:text-foreground"
              >
                {anchor.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle />

            <Button asChild variant="ghost" size="sm" className="rounded-full px-3 text-sm">
              <Link to="/entrar" search={{ tab: "login" }}>
                {texts.common.enter}
              </Link>
            </Button>

            <Button asChild size="sm" className="rounded-full px-4 text-sm">
              <Link to="/entrar" search={{ tab: "signup" }}>
                {texts.common.createAccount}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section aria-labelledby="hero-title" className="border-b border-border">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pb-20 sm:pt-20">
            <p className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary-soft/60 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-primary">
              {texts.landing.hero.badge}
            </p>

            <h1
              id="hero-title"
              className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl"
            >
              {texts.landing.hero.title}
            </h1>

            <p className="mt-6 max-w-2xl text-lg font-normal leading-relaxed text-muted-foreground">
              {texts.landing.hero.description}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full px-7">
                <Link to="/entrar" search={{ tab: "signup" }}>
                  {texts.landing.hero.join}

                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <a href="#proposta">{texts.landing.hero.proposal}</a>
              </Button>
            </div>

            <ul className="mt-14 grid gap-x-8 gap-y-4 border-t border-border pt-7 text-sm text-muted-foreground sm:grid-cols-3">
              {heroFacts.map((fact) => (
                <li key={fact} className="flex items-start gap-2.5">
                  <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />

                  <span>{fact}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Números da comunidade. É o único lugar com dado dinâmico da página: chega de cache
            (servidor ~10 min), é agregado e público. Se a consulta falhar, a faixa inteira
            desaparece — a landing não depende dela e não inventa número nenhum. */}
        {stats ? (
          <section
            aria-labelledby="community-numbers"
            className="border-b border-border bg-foreground text-background"
          >
            <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
              <h2
                id="community-numbers"
                className="text-xs font-semibold uppercase tracking-widest text-background/60"
              >
                {texts.landing.community.eyebrow}
              </h2>

              <div className="mt-8 flex flex-col gap-10 sm:flex-row sm:items-end sm:gap-16">
                <div>
                  <p className="text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
                    {stats.activeUsers.toLocaleString("pt-BR")}
                  </p>

                  <p className="mt-2 text-base text-background/75">
                    {texts.landing.community.activeLabel(stats.windowDays)}
                  </p>
                </div>

                <div className="border-t border-background/20 pt-6 sm:border-l sm:border-t-0 sm:pl-16 sm:pt-0">
                  <p className="text-2xl font-semibold tabular-nums">
                    {stats.totalUsers.toLocaleString("pt-BR")}
                  </p>

                  <p className="mt-1 text-sm text-background/75">
                    {texts.landing.community.totalLabel}
                  </p>
                </div>
              </div>

              <p className="mt-10 max-w-2xl text-xs leading-relaxed text-background/60">
                {texts.landing.community.note}
              </p>
            </div>
          </section>
        ) : null}

        <section id="proposta" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {texts.landing.problem.eyebrow}
            </p>

            <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
              {texts.landing.problem.title}
            </h2>

            <div className="mt-8 grid max-w-3xl gap-5 text-base font-normal leading-relaxed text-muted-foreground">
              {texts.landing.problem.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="mt-16 grid gap-12 border-t border-border pt-12 md:grid-cols-2 md:gap-16">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {texts.landing.problem.standardTitle}
                </h3>

                <ul className="mt-6 space-y-3.5 text-base font-normal leading-relaxed text-muted-foreground">
                  {texts.landing.problem.standardPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span aria-hidden className="mt-3 h-px w-4 shrink-0 bg-border" />

                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:border-l md:border-border md:pl-16">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {texts.landing.problem.oursTitle}
                </h3>

                <ul className="mt-6 space-y-3.5 text-base font-normal leading-relaxed text-foreground">
                  {texts.landing.problem.oursPoints.map((point) => (
                    <li key={point} className="flex items-start gap-3">
                      <span aria-hidden className="mt-0.5 text-primary">
                        →
                      </span>

                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="pratica" className="scroll-mt-20 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {texts.landing.principles.eyebrow}
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {texts.landing.principles.title}
              </h2>

              <p className="mt-5 text-base font-normal leading-relaxed text-muted-foreground">
                {texts.landing.principles.description}
              </p>
            </div>

            <ol className="mt-16 border-t border-border">
              {texts.landing.principles.items.map((principle, index) => (
                <li key={principle.title} className="border-b border-border">
                  <div className="grid gap-3 py-8 sm:grid-cols-[4rem_1fr] sm:gap-6 lg:grid-cols-[7rem_1fr] lg:gap-10">
                    <span
                      aria-hidden
                      className="text-sm font-semibold leading-6 tabular-nums text-primary"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div>
                      <h3 className="text-lg font-semibold sm:text-xl">{principle.title}</h3>

                      <p className="mt-2 max-w-2xl text-base font-normal leading-relaxed text-muted-foreground">
                        {principle.text}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="existe" className="scroll-mt-20 border-b border-border">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {texts.landing.product.eyebrow}
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {texts.landing.product.title}
                </h2>

                <p className="mt-5 max-w-xl text-base font-normal leading-relaxed text-muted-foreground">
                  {texts.landing.product.description}
                </p>

                <div className="mt-10 space-y-9">
                  {texts.landing.product.groups.map((group) => (
                    <div key={group.label}>
                      <h3 className="text-xs font-semibold uppercase tracking-widest text-primary">
                        {group.label}
                      </h3>

                      <ul className="mt-3.5 space-y-2.5 text-sm font-normal leading-relaxed text-muted-foreground">
                        {group.items.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-medium">
                  <Link
                    to="/vagas"
                    className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                  >
                    {texts.landing.product.links.jobs}

                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>

                  <Link
                    to="/diretrizes"
                    className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                  >
                    {texts.landing.product.links.guidelines}

                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>

                  <Link
                    to="/developers"
                    className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                  >
                    {texts.landing.product.links.api}

                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Captura real (sem montagem) de uma página pública do produto, tirada em 17/10/2026
                  em 1440px. Serve para mostrar o produto funcionando de verdade — inclusive para
                  quem está sem conta. */}
              <figure className="lg:mt-16">
                <img
                  src="/landing/vagas.png"
                  alt={texts.landing.product.capture.alt}
                  width={2200}
                  height={1039}
                  loading="lazy"
                  decoding="async"
                  className="w-full rounded-xl border border-border bg-card shadow-card"
                />

                <figcaption className="mt-3.5 text-xs font-normal leading-relaxed text-muted-foreground">
                  {texts.landing.product.capture.caption}
                </figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section id="comunidade" className="scroll-mt-20 border-b border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                  {texts.landing.build.eyebrow}
                </p>

                <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                  {texts.landing.build.title}
                </h2>

                <div className="mt-6 grid gap-4 text-base font-normal leading-relaxed text-muted-foreground">
                  {texts.landing.build.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>

              <ul className="border-t border-border lg:mt-2">
                <li className="border-b border-border">
                  <Link to="/contato" className="group flex items-start justify-between gap-6 py-5">
                    <span>
                      <span className="block text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                        {texts.landing.build.channels.contact.label}
                      </span>

                      <span className="mt-1 block text-sm font-normal leading-relaxed text-muted-foreground">
                        {texts.landing.build.channels.contact.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </Link>
                </li>

                <li className="border-b border-border">
                  <Link
                    to="/diretrizes"
                    className="group flex items-start justify-between gap-6 py-5"
                  >
                    <span>
                      <span className="block text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                        {texts.landing.build.channels.guidelines.label}
                      </span>

                      <span className="mt-1 block text-sm font-normal leading-relaxed text-muted-foreground">
                        {texts.landing.build.channels.guidelines.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </Link>
                </li>

                <li className="border-b border-border">
                  <Link
                    to="/developers"
                    className="group flex items-start justify-between gap-6 py-5"
                  >
                    <span>
                      <span className="block text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                        {texts.landing.build.channels.api.label}
                      </span>

                      <span className="mt-1 block text-sm font-normal leading-relaxed text-muted-foreground">
                        {texts.landing.build.channels.api.description}
                      </span>
                    </span>

                    <ArrowUpRight
                      aria-hidden
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary"
                    />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-primary-soft/40">
          <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 sm:py-28 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:items-center lg:gap-20">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                {texts.landing.finalCta.eyebrow}
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                {texts.landing.finalCta.title}
              </h2>

              <p className="mt-5 max-w-2xl text-base font-normal leading-relaxed text-muted-foreground">
                {texts.landing.finalCta.description}
              </p>

              <p className="mt-4 text-sm font-medium text-foreground">
                {texts.landing.finalCta.free}
              </p>
            </div>

            <div className="flex flex-col items-start gap-3">
              <Button asChild size="lg" className="gap-2 rounded-full px-7">
                <Link to="/entrar" search={{ tab: "signup" }}>
                  {texts.landing.finalCta.createAccount}

                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>

              <Button asChild size="lg" variant="outline" className="rounded-full px-7">
                <Link to="/entrar" search={{ tab: "login" }}>
                  {texts.landing.finalCta.existingAccount}
                </Link>
              </Button>

              <p className="mt-2 text-xs text-muted-foreground">
                {texts.landing.finalCta.finePrint}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <Link to="/" className="flex items-center gap-2" aria-label={texts.brand.name}>
                <span
                  aria-hidden
                  className="grid h-8 w-8 place-items-center rounded-lg text-primary-foreground"
                  style={{ background: "var(--gradient-primary)" }}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                </span>

                <span className="text-base font-semibold tracking-tight">
                  {texts.brand.prefix}

                  <span className="gradient-text">{texts.brand.accent}</span>
                </span>
              </Link>

              <p className="mt-4 max-w-xs text-sm font-normal leading-relaxed text-muted-foreground">
                {texts.landing.footer.tagline}
              </p>
            </div>

            <nav aria-label={texts.landing.footer.sectionsLabel}>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {texts.landing.footer.sectionsLabel}
              </p>

              <ul className="mt-4 space-y-2.5 text-sm">
                {pageAnchors.map((anchor) => (
                  <li key={anchor.href}>
                    <a
                      href={anchor.href}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {anchor.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {texts.landing.footer.projectLabel}
              </p>

              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/privacidade"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {texts.landing.footer.privacy}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/termos"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {texts.landing.footer.terms}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/contato"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {texts.landing.footer.contact}
                  </Link>
                </li>

                <li>
                  <Link
                    to="/developers"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {texts.landing.footer.api}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <p className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
            {texts.landing.footer.copyright(new Date().getFullYear())}
          </p>
        </div>
      </footer>
    </div>
  );
}

/**
 * Rola até a seção pedida na URL (`/#comunidade`).
 *
 * O navegador faz isso sozinho quando a âncora existe no HTML, mas em navegação de SPA (chegar na
 * landing vindo de outra rota) e ao clicar num link de âncora já dentro da página o scroll não
 * acontece. Aqui cobrimos os dois casos.
 */
function useHashScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const scrollToHash = () => {
      const id = window.location.hash.replace(/^#/, "");
      if (!id) return;
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    scrollToHash();
    window.addEventListener("hashchange", scrollToHash);
    return () => window.removeEventListener("hashchange", scrollToHash);
  }, []);
}

const pageAnchors = [
  { href: "#proposta", label: texts.landing.nav.proposal },
  { href: "#pratica", label: texts.landing.nav.practice },
  { href: "#existe", label: texts.landing.nav.exists },
  { href: "#comunidade", label: texts.landing.nav.community },
];

const heroFacts = [
  texts.landing.hero.facts.free,
  texts.landing.hero.facts.noAds,
  texts.landing.hero.facts.feedEnds,
];
