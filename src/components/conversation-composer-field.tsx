import { texts } from "@/texts";
import type { ConversationComposerFieldProps } from "@/types/components/messages/conversation-composer-field-props";

import { Input } from "@/components/ui/input";

export function ConversationComposerField({ text, onTextChange }: ConversationComposerFieldProps) {
  return (
    <Input
      value={text}
      onChange={(event) => onTextChange(event.target.value)}
      placeholder={texts.messages.inputPlaceholder}
      className="h-10 rounded-full bg-muted"
    />
  );
}
