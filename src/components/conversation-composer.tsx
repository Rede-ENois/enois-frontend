import { useConversationComposerController } from "@/utils/components/messages/use-conversation-composer-controller";

import { ConversationComposerField } from "@/components/conversation-composer-field";
import { ConversationComposerSubmit } from "@/components/conversation-composer-submit";

export function ConversationComposer() {
  const { text, setText, submit, submitDisabled } = useConversationComposerController();

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
      <ConversationComposerField text={text} onTextChange={setText} />
      <ConversationComposerSubmit disabled={submitDisabled} />
    </form>
  );
}
