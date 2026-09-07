import { texts } from "@/texts";
import { GraduationCap, Heart, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: texts.landing.features.items.discussions.title,
    desc: texts.landing.features.items.discussions.description,
  },
  {
    icon: GraduationCap,
    title: texts.landing.features.items.mentoring.title,
    desc: texts.landing.features.items.mentoring.description,
  },
  {
    icon: Heart,
    title: texts.landing.features.items.communities.title,
    desc: texts.landing.features.items.communities.description,
  },
  {
    icon: Users,
    title: texts.landing.features.items.connections.title,
    desc: texts.landing.features.items.connections.description,
  },
  {
    icon: ShieldCheck,
    title: texts.landing.features.items.recruiting.title,
    desc: texts.landing.features.items.recruiting.description,
  },
  {
    icon: Sparkles,
    title: texts.landing.features.items.wellbeing.title,
    desc: texts.landing.features.items.wellbeing.description,
  },
];

export function LandingFeatures() {
  return (
    <section id="recursos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">
          {texts.landing.features.eyebrow}
        </p>

        <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          {texts.landing.features.title}
        </h2>

        <p className="mt-4 text-muted-foreground">{texts.landing.features.description}</p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <div key={feature.title} className="surface-card p-4 sm:p-6">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <feature.icon className="h-5 w-5" />
            </div>

            <h3 className="mt-4 font-semibold">{feature.title}</h3>

            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
