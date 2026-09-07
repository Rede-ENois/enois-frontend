import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";

import { getProfile } from "@/lib/api/profile";

export function useProfilePageProfile() {
  const { user: loaderUser } = useLoaderData({ from: "/perfil/$username" });
  const { data } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => getProfile(loaderUser.username),
    initialData: loaderUser,
  });

  return data ?? loaderUser;
}
