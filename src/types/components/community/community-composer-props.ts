import type { FormEventHandler } from "react";

export type CommunityComposerProps = {
  content: string;
  isPending: boolean;
  onContentChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
};
