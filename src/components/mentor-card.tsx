import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { Calendar, Star } from "lucide-react";

import { getProfileById } from "@/lib/api/profile/get-profile-by-id";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { texts } from "@/texts";
import type { MentorCardProps } from "@/types/components/mentoring/mentor-card-props";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";

export function MentorCard({ mentor }: MentorCardProps) {
  const currentUserId = getCurrentUserId();
  const isOwner = currentUserId === mentor.userId;

  const { data: user } = useQuery({
    queryKey: ["profile", mentor.userId],
    queryFn: () => getProfileById(mentor.userId),
  });

  return (
    <article className="surface-card mx-auto w-full max-w-5xl space-y-4 p-5">
      <header className="flex flex-wrap">
        <div className="md:col-span-3">
          <div className="flex h-full items-start justify-center overflow-hidden">
            <UserAvatar
              src={user?.avatar}
              alt={user?.name ?? texts.mentoring.mentorFallback}
              className="h-14 w-14 shrink-0"
            />
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-hidden px-4 md:col-span-6">
          <Link
            to="/perfil/$username"
            params={{ username: user?.username ?? mentor.userId }}
            className="m-0 block truncate font-semibold hover:underline"
          >
            {user?.name ?? texts.mentoring.mentorFallback}
          </Link>
          <p className="line-clamp-2 text-xs text-muted-foreground">{user?.headline ?? ""}</p>
        </div>

        <div className="flex flex-col gap-4 text-[13px] md:col-span-3">
          {!isOwner && (
            <Button className="shrink-0 self-center rounded-lg bg-mentorship-button px-[14px] py-2">
              {texts.mentoring.schedule}
            </Button>
          )}
        </div>
      </header>

      <section>
        {mentor.expertise.map((expertise) => (
          <Badge
            key={expertise}
            variant="secondary"
            className="rounded-full bg-accent font-normal text-accent-foreground"
          >
            {expertise}
          </Badge>
        ))}
      </section>

      <footer className="grid grid-cols-1 gap-8 rounded-2xl">
        <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
          <div>
            <dt className="text-muted-foreground">{texts.mentoring.rating}</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1 font-semibold">
              <Star className="h-3.5 w-3.5 fill-opportunity text-opportunity" /><>{mentor.rating}</>
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{texts.mentoring.sessions}</dt>
            <dd className="mt-0.5 font-semibold">{mentor.sessions}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{texts.mentoring.investment}</dt>
            <dd className="mt-0.5 font-medium">{mentor.price}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{texts.mentoring.nextSlot}</dt>
            <dd className="mt-0.5 inline-flex items-center gap-1 font-medium">
              <Calendar className="h-3.5 w-3.5" /><>{mentor.nextSlot}</>
            </dd>
          </div>
        </dl>
      </footer>
    </article>
  );
}
