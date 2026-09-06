import type { TabButtonProps } from "@/types/components/tab-button-props";

export function TabButton({ active, variant, onClick, children }: TabButtonProps) {
  const className =
    variant === "auth"
      ? `flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
          active
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`
      : `whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-light transition ${
          active
            ? "bg-primary text-primary-foreground"
            : "border border-border-soft bg-surface-card text-text-subtle hover:border-primary hover:text-primary"
        }`;

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}
