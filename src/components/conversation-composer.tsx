import { texts } from "@/texts";
import type { ConversationComposerProps } from "@/types/components/messages/conversation-composer-props";
import { Send } from "lucide-react";

import { useConversationComposerController } from "@/utils/components/messages/use-conversation-composer-controller";

import { Input } from "@/components/ui/input";

export function ConversationComposer({ conversationId }: ConversationComposerProps) {
  const { text, setText, submit, submitDisabled } =
    useConversationComposerController(conversationId);

  return (
    <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-3">
      <Input
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder={texts.messages.inputPlaceholder}
        className="h-10 rounded-full bg-muted"
      />

      <button
        type="submit"
        disabled={submitDisabled}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
