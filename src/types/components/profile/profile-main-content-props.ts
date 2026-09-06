import type { PostView, Profile } from "@/lib/api";

export type ProfileMainContentProps = {
  user: Profile;
  posts: PostView[];
};
