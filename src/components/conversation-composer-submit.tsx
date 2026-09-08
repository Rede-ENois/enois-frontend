import { useConversationComposerContext } from "@/utils/components/messages/use-conversation-composer-context";
import { Send } from "lucide-react";

export function ConversationComposerSubmit() {
  const { submitDisabled } = useConversationComposerContext();

  return (
    <button
      type="submit"
      disabled={submitDisabled}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      <Send className="h-4 w-4" />
    </button>
  );
}
