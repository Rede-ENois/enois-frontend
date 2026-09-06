import type { MentionSuggestionsProps } from "@/types/components/mention-textarea/mention-suggestions-props";

import { UserAvatar } from "@/components/user-avatar";

export function MentionSuggestions({
  results,
  selectedIndex,
  onSelect,
  onHover,
}: MentionSuggestionsProps) {
  return (
    <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
      {results.map((user, index) => (
        <button
          key={user.id}
          type="button"
          onMouseDown={(event) => {
            event.preventDefault();
            onSelect(user);
          }}
          onMouseEnter={() => onHover(index)}
          className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
            index === selectedIndex ? "bg-muted" : "hover:bg-muted"
          }`}
        >
          <UserAvatar src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0" />
          <div className="min-w-0">
            <p className="truncate font-medium">{user.name}</p>
            <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
