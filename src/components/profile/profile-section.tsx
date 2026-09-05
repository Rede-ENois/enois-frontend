type ProfileSectionProps = {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
};

export function ProfileSection({ title, icon: Icon, children }: ProfileSectionProps) {
  return (
    <section className="rounded-2xl border border-border-soft bg-surface-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 text-[15px] font-light text-text-strong">
        {Icon && (
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-surface-2">
            <Icon className="h-4 w-4 text-primary" />
          </span>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}
