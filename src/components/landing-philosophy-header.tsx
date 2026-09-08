import { texts } from "@/texts";

export function LandingPhilosophyHeader() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        {texts.landing.philosophy.eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        <>{texts.landing.philosophy.titlePrefix}</>
        <span className="gradient-text">{texts.landing.philosophy.titleAccent}</span>
      </h2>
      <p className="mt-4 text-muted-foreground">{texts.landing.philosophy.description}</p>
    </div>
  );
}
