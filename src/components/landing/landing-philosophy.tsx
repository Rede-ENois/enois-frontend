import { GraduationCap, Heart, ShieldCheck, Users } from "lucide-react";

import { texts } from "@/texts";

const values = [
  { icon: Heart, title: texts.landing.philosophy.values.authenticity.title, desc: texts.landing.philosophy.values.authenticity.description },
  { icon: Users, title: texts.landing.philosophy.values.collaboration.title, desc: texts.landing.philosophy.values.collaboration.description },
  { icon: GraduationCap, title: texts.landing.philosophy.values.learning.title, desc: texts.landing.philosophy.values.learning.description },
  { icon: ShieldCheck, title: texts.landing.philosophy.values.safety.title, desc: texts.landing.philosophy.values.safety.description },
];

export function LandingPhilosophy() {
  return (
    <section id="filosofia" className="border-y border-border bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-medium uppercase tracking-widest text-primary">
            {texts.landing.philosophy.eyebrow}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            {texts.landing.philosophy.titlePrefix}{" "}
            <span className="gradient-text">{texts.landing.philosophy.titleAccent}</span>
          </h2>
          <p className="mt-4 text-muted-foreground">{texts.landing.philosophy.description}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {values.map((v) => (
            <div key={v.title} className="surface-card p-6 text-center">
              <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <v.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{v.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-primary">
            <ShieldCheck className="h-4 w-4" /> {texts.landing.philosophy.alwaysFree}
          </p>
        </div>
      </div>
    </section>
  );
}
