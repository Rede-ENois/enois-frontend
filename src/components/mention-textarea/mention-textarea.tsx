import { MentionSuggestions } from "./mention-suggestions";
import { useMentionTextarea } from "./use-mention-textarea";

type MentionTextareaProps = {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  className?: string;
  maxLength?: number;
  rows?: number;
};

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  maxLength,
  rows,
}: MentionTextareaProps) {
  const mention = useMentionTextarea(value, onChange);
  const showSuggestions = mention.mentionQuery.length >= 2 && mention.results.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={mention.textareaRef}
        value={value}
        onInput={mention.handleInput}
        onKeyDown={mention.handleKeyDown}
        placeholder={placeholder}
        className={`w-full resize-none ${className}`}
        maxLength={maxLength}
        rows={rows}
      />
      {showSuggestions && (
        <MentionSuggestions
          results={mention.results}
          selectedIndex={mention.selectedIndex}
          onSelect={mention.handleSelect}
          onHover={mention.setSelectedIndex}
        />
      )}
    </div>
  );
}
