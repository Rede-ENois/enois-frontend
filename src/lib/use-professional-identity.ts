import { useQuery } from "@tanstack/react-query";

import { corporateApi } from "@/lib/api";
import { professionalReady } from "@/lib/interface-context";
import { useIsAuthenticated } from "@/lib/use-auth";

/**
 * The professional identity that signs work actions (applications, proposals), as the dialogs show
 * it: the active one, or the setup link while there is none. While the profile is loading neither
 * is set, so nothing flashes. The backend validates it again on every action.
 */
export function useProfessionalIdentity() {
  const authenticated = useIsAuthenticated();
  const { data, isSuccess } = useQuery({
    queryKey: ["business-profile"],
    queryFn: () => corporateApi.me(),
    enabled: authenticated,
    staleTime: 120_000,
  });
  const ready = professionalReady(data);
  return {
    applicant: ready && data ? { name: data.name, username: data.username } : null,
    professionalSetupHref: isSuccess && !ready ? "/profissional" : null,
  };
}
