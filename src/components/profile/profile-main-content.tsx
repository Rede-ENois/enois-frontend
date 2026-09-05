import { Target } from "lucide-react";

import type { PostView, Profile } from "@/lib/api";
import { texts } from "@/texts";

import { PostCard } from "@/components/post-card";
import { ProfileSection } from "./profile-section";

type ProfileMainContentProps = {
  user: Profile;
  posts: PostView[];
};

export function ProfileMainContent({ user, posts }: ProfileMainContentProps) {
  return (
    <div className="space-y-6">
      {user.bio && (
        <ProfileSection title={texts.profile.sections.about}>
          <p className="break-words text-[13px] font-light leading-relaxed text-text-subtle">
            {user.bio}
          </p>
        </ProfileSection>
      )}

      {user.skills.length > 0 && (
        <ProfileSection title={texts.profile.sections.skills}>
          <div className="flex flex-wrap gap-1.5">
            {user.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-light text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        </ProfileSection>
      )}

      {user.goals.length > 0 && (
        <ProfileSection title={texts.profile.sections.goals} icon={Target}>
          <div className="grid gap-3 sm:grid-cols-3">
            {user.goals.map((goal) => (
              <div key={goal} className="rounded-xl border border-border-soft p-4">
                <p className="break-words text-[13px] font-light text-text-strong">{goal}</p>
              </div>
            ))}
          </div>
        </ProfileSection>
      )}

      <ProfileSection title={texts.profile.sections.recentPosts}>
        {posts.length === 0 ? (
          <p className="text-[13px] font-light text-text-subtle">{texts.profile.noPosts}</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </ProfileSection>
    </div>
  );
}
