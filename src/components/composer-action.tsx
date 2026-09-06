import type { ComposerActionProps } from "@/types/components/feed/composer-action-props";

export function ComposerAction({ icon: Icon, label, active, onClick }: ComposerActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-light transition ${
        active
          ? "bg-primary text-primary-foreground"
          : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <>{label}</>
    </button>
  );
}
