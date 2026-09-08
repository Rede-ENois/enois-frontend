import type { Profile } from "@/types/application/profile/profile";

export function createProfileGoalsSectionViewModel(user: Profile) {
  return {
    visible: user.goals.length > 0,
    goals: user.goals,
  };
}
