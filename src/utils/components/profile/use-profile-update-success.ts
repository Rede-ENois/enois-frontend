import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";

import type { Profile } from "@/types/application/profile/profile";

export function useProfileUpdateSuccess(profile: Profile, onSaved: () => void) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return (updated: Profile) => {
    queryClient.invalidateQueries({ queryKey: ["me"] });
    queryClient.invalidateQueries({ queryKey: ["profile", profile.username] });

    if (updated.username && updated.username !== profile.username) {
      queryClient.invalidateQueries({ queryKey: ["profile", updated.username] });
      router.navigate({
        to: "/perfil/$username",
        params: { username: updated.username },
        replace: true,
      });
    }

    onSaved();
  };
}
