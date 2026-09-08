import type { ConversationComposerSubmitProps } from "@/types/components/messages/conversation-composer-submit-props";
import { Send } from "lucide-react";

export function ConversationComposerSubmit({ disabled }: ConversationComposerSubmitProps) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
    >
      <Send className="h-4 w-4" />
    </button>
  );
}
