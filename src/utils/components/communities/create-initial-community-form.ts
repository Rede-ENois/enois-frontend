import type { CreateCommunityInput } from "@/types/application/community/create-community-input";

export function createInitialCommunityForm(): CreateCommunityInput {
  return {
    name: "",
    description: "",
    topic: "TECNOLOGIA",
  };
}
