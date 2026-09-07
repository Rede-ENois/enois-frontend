import type { LegalSectionProps } from "@/types/components/legal/legal-section-props";

export function LegalSection({ title, children }: LegalSectionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>

      <div className="space-y-2 text-[14px] leading-relaxed text-muted-foreground [&_p]:whitespace-pre-line">
        {children}
      </div>
    </section>
  );
}
