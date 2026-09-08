import { texts } from "@/texts";
import { useConversationComposerContext } from "@/utils/components/messages/use-conversation-composer-context";

import { Input } from "@/components/ui/input";

export function ConversationComposerField() {
  const { text, setText } = useConversationComposerContext();

  return (
    <Input
      value={text}
      onChange={(event) => setText(event.target.value)}
      placeholder={texts.messages.inputPlaceholder}
      className="h-10 rounded-full bg-muted"
    />
  );
}
