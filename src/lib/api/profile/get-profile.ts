import type { Profile } from "@/types/application/profile/profile";

import { apiRequest } from "@/lib/api-request";

export function getProfile(username: string) {
  return apiRequest<Profile>("GET", `/users/${username}`);
}
