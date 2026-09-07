import type { Profile } from "@/types/application/profile/profile";

import { apiRequest } from "@/lib/api-request";

export function getCurrentProfile() {
  return apiRequest<Profile>("GET", "/me");
}
