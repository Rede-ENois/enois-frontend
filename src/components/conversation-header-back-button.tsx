import { useMessagesStore } from "@/stores/messages.store";
import { ArrowLeft } from "lucide-react";

export function ConversationHeaderBackButton() {
  const clearConversation = useMessagesStore((state) => state.clearConversation);

  return (
    <button
      onClick={clearConversation}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
