import { useConversationComposerContext } from "@/utils/components/messages/use-conversation-composer-context";

import { ConversationComposerField } from "@/components/conversation-composer-field";
import { ConversationComposerSubmit } from "@/components/conversation-composer-submit";

export function ConversationComposer() {
  const { submit } = useConversationComposerContext();

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
      <ConversationComposerField />
      <ConversationComposerSubmit />
    </form>
  );
}
