import type { Mentor, Profile } from "@/lib/api";

export type MentorListItem = {
  mentor: Mentor;
  user?: Profile;
  isOwner: boolean;
};
