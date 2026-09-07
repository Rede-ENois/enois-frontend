import type { Profile } from "@/types/application/profile/profile";

export type MentorCardHeaderProps = {
  mentorUserId: string;
  user?: Profile;
  showSchedule: boolean;
};
