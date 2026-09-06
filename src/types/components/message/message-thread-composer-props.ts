import type { FormEventHandler } from "react";

export type MessageThreadComposerProps = {
  messageText: string;
  isSending: boolean;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};
