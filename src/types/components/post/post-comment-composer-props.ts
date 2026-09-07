import type { FormEventHandler } from "react";

import type { Profile } from "@/types/application/profile/profile";
import type { Props as MentionTextareaProps } from "@/types/components/mention-textarea/props";

export type PostCommentComposerProps = {
  currentUser: Profile | null;
  draft: string;
  onDraftChange: MentionTextareaProps["onChange"];
  onSubmit: FormEventHandler<HTMLFormElement>;
  submitDisabled: boolean;
};
