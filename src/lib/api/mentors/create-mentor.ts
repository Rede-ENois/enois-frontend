import type { CreateMentorInput } from "@/types/application/mentor/create-mentor-input";
import type { Mentor } from "@/types/application/mentor/mentor";

import { apiRequest } from "@/lib/api-request";

export function createMentor(data: CreateMentorInput) {
  return apiRequest<Mentor>("POST", "/mentors", data, { idempotent: true });
}
