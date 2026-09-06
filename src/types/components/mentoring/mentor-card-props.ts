import type { Mentor, Profile } from "@/lib/api";

export type MentorCardProps = {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
};
