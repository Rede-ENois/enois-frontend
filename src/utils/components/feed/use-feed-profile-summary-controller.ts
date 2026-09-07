import { useQuery } from "@tanstack/react-query";

import { getCurrentProfile } from "@/lib/api/profile/get-current-profile";

export function useFeedProfileSummaryController() {
  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getCurrentProfile,
  });

  return {
    visible: Boolean(profile),
    profile,
  };
}
