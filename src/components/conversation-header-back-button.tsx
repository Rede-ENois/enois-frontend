import { ArrowLeft } from "lucide-react";

import { useConversationHeaderBackButtonController } from "@/utils/components/messages/use-conversation-header-back-button-controller";

export function ConversationHeaderBackButton() {
  const { clearConversation } = useConversationHeaderBackButtonController();

  return (
    <button
      onClick={clearConversation}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
