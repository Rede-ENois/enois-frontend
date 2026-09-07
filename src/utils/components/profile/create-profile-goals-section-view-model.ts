import type { ProfileHeaderProps } from "@/types/components/profile/profile-header-props";

export function createProfileGoalsSectionViewModel({ user }: ProfileHeaderProps) {
  return {
    visible: user.goals.length > 0,
    goals: user.goals,
  };
}
