import { texts } from "@/texts";
import type { Props } from "@/types/components/mention-textarea/props";

import { useMentionTextarea } from "@/utils/components/mentions/use-mention-textarea";

import { UserAvatar } from "@/components/user-avatar";

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  maxLength,
  rows,
}: Props) {
  const { textareaRef, handleInput, handleKey, showSuggestions, suggestions } = useMentionTextarea(
    value,
    onChange,
  );

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={textareaRef}
        value={value}
        onInput={handleInput}
        onKeyDown={handleKey}
        placeholder={placeholder}
        className={`w-full resize-none ${className}`}
        maxLength={maxLength}
        rows={rows}
      />
      {showSuggestions && (
        <div className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-lg">
          {suggestions.map(({ user, selected, onMouseDown, onMouseEnter }) => (
            <button
              key={user.id}
              type="button"
              onMouseDown={onMouseDown}
              onMouseEnter={onMouseEnter}
              className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
                selected ? "bg-muted" : "hover:bg-muted"
              }`}
            >
              <UserAvatar src={user.avatar} alt={user.name} className="h-8 w-8 shrink-0" />

              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>

                <p className="truncate text-xs text-muted-foreground">
                  {texts.mentions.username(user.username)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
