import { texts } from "@/texts";

export function LandingFeaturesHeader() {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-medium uppercase tracking-widest text-primary">
        {texts.landing.features.eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        {texts.landing.features.title}
      </h2>
      <p className="mt-4 text-muted-foreground">{texts.landing.features.description}</p>
    </div>
  );
}
