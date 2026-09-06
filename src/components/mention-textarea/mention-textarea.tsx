import type { MentionTextareaProps } from "@/types/components/mention-textarea/mention-textarea-props";

import { MentionSuggestions } from "./mention-suggestions";
import { useMentionTextarea } from "./use-mention-textarea";

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  maxLength,
  rows,
}: MentionTextareaProps) {
  const mentionState = useMentionTextarea(value, onChange);
  const hasSuggestions =
    mentionState.mentionQuery.length >= 2 && mentionState.mentionResults.length > 0;

  return (
    <div className="relative min-w-0 flex-1">
      <textarea
        ref={mentionState.textareaRef}
        value={value}
        onInput={mentionState.handleInput}
        onKeyDown={mentionState.handleKeyDown}
        placeholder={placeholder}
        className={`w-full resize-none ${className}`}
        maxLength={maxLength}
        rows={rows}
      />
      {hasSuggestions && (
        <MentionSuggestions
          results={mentionState.mentionResults}
          selectedIndex={mentionState.selectedIndex}
          onSelect={mentionState.handleSelect}
          onHover={mentionState.setSelectedIndex}
        />
      )}
    </div>
  );
}
