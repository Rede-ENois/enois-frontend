import type { FormEventHandler } from "react";

import type { Conversation, Message, Profile } from "@/lib/api";

export type MessageThreadProps = {
  conversation: Conversation | null;
  otherUser?: Profile;
  currentUserId: string;
  messages: Message[];
  messageText: string;
  isSending: boolean;
  onBack: () => void;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};
