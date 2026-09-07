import type { PostCardStore } from "@/types/stores/post-card-store";
import { createPostCardCommentActions } from "@/utils/stores/create-post-card-comment-actions";
import { createPostCardComposerActions } from "@/utils/stores/create-post-card-composer-actions";
import { createPostCardCounterActions } from "@/utils/stores/create-post-card-counter-actions";
import { createPostCardDialogActions } from "@/utils/stores/create-post-card-dialog-actions";
import { createPostCardLifecycleActions } from "@/utils/stores/create-post-card-lifecycle-actions";
import { createPostCardReactionActions } from "@/utils/stores/create-post-card-reaction-actions";
import { create } from "zustand";

export const usePostCardStore = create<PostCardStore>()((set) => ({
  cards: {},
  ...createPostCardLifecycleActions(set),
  ...createPostCardComposerActions(set),
  ...createPostCardCommentActions(set),
  ...createPostCardCounterActions(set),
  ...createPostCardReactionActions(set),
  ...createPostCardDialogActions(set),
}));
