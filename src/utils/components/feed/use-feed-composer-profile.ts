import { useQuery } from "@tanstack/react-query";

import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";

export function useFeedComposerProfile() {
  return useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  }).data;
}
