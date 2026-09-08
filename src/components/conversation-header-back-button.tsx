import { ArrowLeft } from "lucide-react";

import type { ConversationHeaderBackButtonProps } from "@/types/components/messages/conversation-header-back-button-props";

export function ConversationHeaderBackButton({ onBack }: ConversationHeaderBackButtonProps) {
  return (
    <button
      onClick={onBack}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-muted md:hidden"
    >
      <ArrowLeft className="h-4 w-4" />
    </button>
  );
}
