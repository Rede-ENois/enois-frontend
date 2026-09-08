import type { JobsFilterOptionButtonProps } from "@/types/components/jobs/jobs-filter-option-button-props";

export function JobsFilterOptionButton({ option }: JobsFilterOptionButtonProps) {
  return (
    <button
      onClick={option.onSelect}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        option.selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      }`}
    >
      {option.label}
    </button>
  );
}
