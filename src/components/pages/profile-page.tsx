import { useQuery } from "@tanstack/react-query";
import { useLoaderData } from "@tanstack/react-router";

import { Target } from "lucide-react";

import { listPostsByUserId } from "@/lib/api/feed/list-posts-by-user-id";
import { getProfile } from "@/lib/api/profile/get-profile";
import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";
import { PostCard } from "@/components/post-card";
import { ProfileHeader } from "@/components/profile-header";
import { ProfileSection } from "@/components/profile-section";
import { ProfileSidebar } from "@/components/profile-sidebar";

export function Profile() {
  const { user: loaderUser } = useLoaderData({ from: "/perfil/$username" });

  const { data: liveProfile } = useQuery({
    queryKey: ["profile", loaderUser.username],
    queryFn: () => getProfile(loaderUser.username),
    initialData: loaderUser,
  });

  const user = liveProfile ?? loaderUser;

  const { data: feedData } = useQuery({
    queryKey: ["feed", "user", user.id],
    queryFn: () => listPostsByUserId(user.id),
  });

  const userPosts = feedData?.items ?? [];

  return (
    <AppContainer>
      <div className="space-y-6">
        <ProfileHeader user={user} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
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
              {userPosts.length === 0 ? (
                <p className="text-[13px] font-light text-text-subtle">{texts.profile.noPosts}</p>
              ) : (
                <div className="space-y-4">
                  {userPosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              )}
            </ProfileSection>
          </div>

          <ProfileSidebar user={user} />
        </div>
      </div>
      <div className="h-4 lg:hidden" />
    </AppContainer>
  );
}
