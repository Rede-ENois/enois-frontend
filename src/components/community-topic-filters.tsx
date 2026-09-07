import type { CommunityTopicFiltersProps } from "@/types/components/communities/community-topic-filters-props";

export function CommunityTopicFilters({ options }: CommunityTopicFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={option.select}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
            option.selected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
