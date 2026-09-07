import type { Profile } from "@/types/application/profile/profile";

import { apiRequest } from "@/lib/api-request";

export function getProfileById(id: string) {
  return apiRequest<Profile>("GET", `/users/by-id/${id}`);
}
