import { useCommunitiesPageContext } from "@/utils/components/communities/use-communities-page-context";

export function CommunityTopicFilters() {
  const { topicOptions } = useCommunitiesPageContext();

  return (
    <div className="flex flex-wrap gap-2">
      {topicOptions.map((option) => (
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
