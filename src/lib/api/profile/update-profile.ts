import type { Profile } from "@/types/application/profile/profile";
import type { UpdateProfileRequest } from "@/types/application/profile/update-profile-request";

import { apiRequest } from "@/lib/api-request";

export function updateProfile(data: UpdateProfileRequest) {
  return apiRequest<Profile>("PATCH", "/me/profile", data, { idempotent: true });
}
