import { COMMUNITY_EDIT_DIALOG_INITIAL_STATE } from "@/constants/community-edit-dialog-initial-state";
import type { CommunityEditDialogStore } from "@/types/stores/community-edit-dialog-store";
import { create } from "zustand";

export const useCommunityEditDialogStore = create<CommunityEditDialogStore>()((set) => ({
  ...COMMUNITY_EDIT_DIALOG_INITIAL_STATE,
  setOpen: (open) => set({ open }),
  close: () => set(COMMUNITY_EDIT_DIALOG_INITIAL_STATE),
}));
