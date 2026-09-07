import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";

import { getProfile } from "@/lib/api/profile";

export function useProfilePageController() {
  const { user: loaderUser } = useLoaderData({ from: "/perfil/$username" });
  const { data } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => getProfile(loaderUser.username),
    initialData: loaderUser,
  });

  return { user: data ?? loaderUser };
}
