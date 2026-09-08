import { useCommunityEditDialogStore } from "@/stores/community-edit-dialog.store";

export function useCommunityHeaderEditActionController() {
  const open = useCommunityEditDialogStore((state) => state.open);
  const setOpen = useCommunityEditDialogStore((state) => state.setOpen);

  return { open, setOpen };
}
