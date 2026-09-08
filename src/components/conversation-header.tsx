import { ConversationHeaderBackButton } from "@/components/conversation-header-back-button";
import { ConversationHeaderIdentity } from "@/components/conversation-header-identity";

export function ConversationHeader() {
  return (
    <header className="flex items-center gap-3 border-b border-border p-4">
      <div className="flex min-w-0 items-center gap-3">
        <ConversationHeaderBackButton />
        <ConversationHeaderIdentity />
      </div>
    </header>
  );
}
