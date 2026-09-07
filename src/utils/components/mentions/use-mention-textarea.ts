import { type FormEvent, useRef, useState } from "react";

import { createMentionKeyHandler } from "@/utils/components/mentions/create-mention-key-handler";
import { createMentionPicker } from "@/utils/components/mentions/create-mention-picker";
import { createMentionSuggestions } from "@/utils/components/mentions/create-mention-suggestions";
import { useActiveMention } from "@/utils/components/mentions/use-active-mention";
import { useMentionResults } from "@/utils/components/mentions/use-mention-results";
import { useMentionSelectionIndex } from "@/utils/components/mentions/use-mention-selection-index";

export function useMentionTextarea(
  value: string,
  onChange: (value: string, mentionedUserIds: string[]) => void,
) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const mention = useActiveMention();
  const results = useMentionResults(mention.query);
  const selection = useMentionSelectionIndex(results.length);
  const pick = createMentionPicker(
    value,
    mention.query,
    mention.index,
    mentionedIds,
    setMentionedIds,
    mention.clear,
    onChange,
    textareaRef,
  );

  return {
    textareaRef,
    handleInput: (event: FormEvent<HTMLTextAreaElement>) => {
      const element = event.currentTarget;
      mention.update(element.value, element.selectionStart);
      onChange(element.value, mentionedIds);
    },
    handleKey: createMentionKeyHandler(
      mention.index,
      results,
      selection.selectedIndex,
      selection.next,
      selection.previous,
      pick,
      mention.clear,
    ),
    showSuggestions: mention.query.length >= 2 && results.length > 0,
    suggestions: createMentionSuggestions(results, selection.selectedIndex, selection.select, pick),
  };
}
